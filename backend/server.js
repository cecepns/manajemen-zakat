require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "zakat_secret_key";
const UPLOAD_DIR = path.join(__dirname, "uploads-zakat");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.join(__dirname, "backups"))) fs.mkdirSync(path.join(__dirname, "backups"), { recursive: true });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zakat_db",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "+07:00",
});

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

// Helpers
const sanitize = (str) => (typeof str === "string" ? str.trim().replace(/[<>]/g, "") : str);
const toNum = (v) => parseFloat(v) || 0;
const toInt = (v) => parseInt(v, 10) || 0;

const paginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});

const paginateSql = (limit, offset) => {
  const safeLimit = Math.min(100, Math.max(1, toInt(limit) || 10));
  const safeOffset = Math.max(0, toInt(offset) || 0);
  return `LIMIT ${safeLimit} OFFSET ${safeOffset}`;
};

const calcTransactionAmounts = (body, defaultRicePrice) => {
  const jiwa = toInt(body.fitrah_jiwa);
  const ricePrice = toNum(body.rice_price_per_jiwa) || defaultRicePrice;
  const fitrahMoney = jiwa * ricePrice;
  const fitrahRice = toNum(body.fitrah_rice_kg);
  const maalAmt = toNum(body.maal);
  const fidyahAmt = toNum(body.fidyah);
  const infaqAmt = toNum(body.infaq);
  const grandTotal = fitrahMoney + maalAmt + fidyahAmt + infaqAmt;
  const paymentAmt = toNum(body.payment);
  const changeMoney = paymentAmt - grandTotal;
  return { jiwa, ricePrice, fitrahMoney, fitrahRice, maalAmt, fidyahAmt, infaqAmt, grandTotal, paymentAmt, changeMoney };
};

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, message: "Token tidak ditemukan" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query("SELECT id, name, username, role, is_active FROM users WHERE id = ?", [decoded.id]);
    if (!rows.length || !rows[0].is_active) return res.status(401).json({ success: false, message: "User tidak valid" });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Token tidak valid" });
  }
};

const roleMiddleware = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: "Akses ditolak" });
  next();
};

const auditLog = async (userId, action, entity, entityId, description, ip) => {
  await pool.query(
    "INSERT INTO audit_logs (user_id, action, entity, entity_id, description, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, action, entity, entityId, description, ip]
  );
};

const generateTransactionCode = async () => {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT last_number FROM transaction_counter WHERE period_code = ? FOR UPDATE", [ym]);
    let num = 1;
    if (rows.length) {
      num = rows[0].last_number + 1;
      await conn.query("UPDATE transaction_counter SET last_number = ? WHERE period_code = ?", [num, ym]);
    } else {
      await conn.query("INSERT INTO transaction_counter (period_code, last_number) VALUES (?, ?)", [ym, num]);
    }
    await conn.commit();
    return `ZKT-${ym}-${String(num).padStart(5, "0")}`;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

const getSetting = async (key) => {
  const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = ?", [key]);
  return rows[0]?.setting_value || "";
};

const getAmilBalance = async (amilId) => {
  const [received] = await pool.query(
    "SELECT COALESCE(SUM(grand_total), 0) AS total FROM transactions WHERE amil_id = ? AND status = 'PRINTED'",
    [amilId]
  );
  const [deposited] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM deposit_bendahara WHERE amil_id = ? AND status = 'VERIFIED'",
    [amilId]
  );
  const totalReceived = parseFloat(received[0].total);
  const totalDepositedRaw = parseFloat(deposited[0].total);
  const totalDeposited = Math.min(totalDepositedRaw, totalReceived);
  const balance = Math.max(0, totalReceived - totalDepositedRaw);
  return { totalReceived, totalDeposited, balance };
};

const getOrgDepositStats = async () => {
  const [rows] = await pool.query(
    `SELECT
       COALESCE(SUM(GREATEST(0, received - deposited)), 0) AS total_held,
       COALESCE(SUM(CASE WHEN received > 0 THEN LEAST(deposited, received) ELSE 0 END), 0) AS total_deposited
     FROM (
       SELECT u.id,
         COALESCE((
           SELECT SUM(grand_total) FROM transactions
           WHERE amil_id = u.id AND status = 'PRINTED'
         ), 0) AS received,
         COALESCE((
           SELECT SUM(amount) FROM deposit_bendahara
           WHERE amil_id = u.id AND status = 'VERIFIED'
         ), 0) AS deposited
       FROM users u
       WHERE u.role = 'AMIL' AND u.is_active = 1
     ) balances`
  );
  return {
    total_held_by_amil: parseFloat(rows[0].total_held) || 0,
    total_deposited: parseFloat(rows[0].total_deposited) || 0,
  };
};

const parseDateOnly = (value) => {
  const raw = sanitize(String(value || "")).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
};

/** Preset filters use MySQL CURDATE() so boundaries match stored DATETIME (WIB). */
const buildDateFilter = (filter, dateFrom, dateTo) => {
  switch (filter) {
    case "today":
      return { clause: " AND DATE(t.transaction_date) = CURDATE()", params: [] };
    case "week":
      return { clause: " AND YEARWEEK(t.transaction_date, 1) = YEARWEEK(CURDATE(), 1)", params: [] };
    case "month":
      return {
        clause: " AND YEAR(t.transaction_date) = YEAR(CURDATE()) AND MONTH(t.transaction_date) = MONTH(CURDATE())",
        params: [],
      };
    case "custom": {
      const from = parseDateOnly(dateFrom);
      const to = parseDateOnly(dateTo);
      const clauses = [];
      const params = [];
      if (from) {
        clauses.push("DATE(t.transaction_date) >= ?");
        params.push(from);
      }
      if (to) {
        clauses.push("DATE(t.transaction_date) <= ?");
        params.push(to);
      }
      return { clause: clauses.length ? ` AND ${clauses.join(" AND ")}` : "", params };
    }
    default:
      return { clause: "", params: [] };
  }
};

// ==================== AUTH ====================
app.post("/api/auth/login", async (req, res) => {
  try {
    const username = sanitize(req.body.username);
    const password = req.body.password;
    if (!username || !password) return res.status(400).json({ success: false, message: "Username dan password wajib diisi" });

    const [rows] = await pool.query("SELECT * FROM users WHERE username = ? AND is_active = 1", [username]);
    if (!rows.length) return res.status(401).json({ success: false, message: "Username atau password salah" });

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ success: false, message: "Username atau password salah" });

    const token = jwt.sign({ id: rows[0].id, role: rows[0].role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    const { password: _, ...user } = rows[0];
    await auditLog(rows[0].id, "LOGIN", "users", rows[0].id, "User login", req.ip);
    res.json({ success: true, data: { token, user } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/auth/profile", authMiddleware, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// ==================== USERS ====================
app.get("/api/users", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page) || 1);
    const limit = [10, 25, 50, 100].includes(toInt(req.query.limit)) ? toInt(req.query.limit) : 10;
    const search = sanitize(req.query.search) || "";
    const role = sanitize(req.query.role) || "";
    const sort = ["name", "username", "role", "created_at"].includes(req.query.sort) ? req.query.sort : "created_at";
    const order = req.query.order === "asc" ? "ASC" : "DESC";
    const offset = (page - 1) * limit;

    let where = "WHERE 1=1";
    const params = [];
    if (search) { where += " AND (name LIKE ? OR username LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
    if (role) { where += " AND role = ?"; params.push(role); }

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM users ${where}`, params);
    const [rows] = await pool.query(
      `SELECT id, name, username, role, is_active, created_at FROM users ${where} ORDER BY ${sort} ${order} ${paginateSql(limit, offset)}`,
      params
    );
    res.json({ success: true, data: rows, pagination: paginationMeta(page, limit, countRows[0].total) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/users", authMiddleware, roleMiddleware("ADMIN"), async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    if (!name || !username || !password || !role) return res.status(400).json({ success: false, message: "Data tidak lengkap" });
    if (!["ADMIN", "BENDAHARA", "AMIL"].includes(role)) return res.status(400).json({ success: false, message: "Role tidak valid" });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)",
      [sanitize(name), sanitize(username), hashed, role]
    );
    await auditLog(req.user.id, "CREATE", "users", result.insertId, `Buat user ${username}`, req.ip);
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") return res.status(400).json({ success: false, message: "Username sudah digunakan" });
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put("/api/users/:id", authMiddleware, roleMiddleware("ADMIN"), async (req, res) => {
  try {
    const { name, username, password, role, is_active } = req.body;
    const updates = [];
    const params = [];
    if (name) { updates.push("name = ?"); params.push(sanitize(name)); }
    if (username) { updates.push("username = ?"); params.push(sanitize(username)); }
    if (role) { updates.push("role = ?"); params.push(role); }
    if (typeof is_active !== "undefined") { updates.push("is_active = ?"); params.push(is_active ? 1 : 0); }
    if (password) { updates.push("password = ?"); params.push(await bcrypt.hash(password, 10)); }
    if (!updates.length) return res.status(400).json({ success: false, message: "Tidak ada data diupdate" });

    params.push(req.params.id);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);
    await auditLog(req.user.id, "UPDATE", "users", req.params.id, "Update user", req.ip);
    res.json({ success: true, message: "User berhasil diupdate" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete("/api/users/:id", authMiddleware, roleMiddleware("ADMIN"), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ success: false, message: "Tidak bisa hapus akun sendiri" });
    await pool.query("UPDATE users SET is_active = 0 WHERE id = ?", [req.params.id]);
    await auditLog(req.user.id, "DELETE", "users", req.params.id, "Nonaktifkan user", req.ip);
    res.json({ success: true, message: "User berhasil dinonaktifkan" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==================== SETTINGS ====================
app.get("/api/settings", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT setting_key, setting_value FROM settings");
    const settings = {};
    rows.forEach((r) => { settings[r.setting_key] = r.setting_value; });
    res.json({ success: true, data: settings });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put("/api/settings", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await pool.query(
        "INSERT INTO settings (setting_key, setting_value, updated_by) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?",
        [key, String(value), req.user.id, String(value), req.user.id]
      );
    }
    await auditLog(req.user.id, "UPDATE", "settings", null, "Update pengaturan", req.ip);
    res.json({ success: true, message: "Pengaturan berhasil disimpan" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/settings/logo", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), upload.single("logo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "File logo wajib diupload" });
    const logoPath = `/uploads/${req.file.filename}`;
    await pool.query(
      "INSERT INTO settings (setting_key, setting_value, updated_by) VALUES ('org_logo', ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?",
      [logoPath, req.user.id, logoPath, req.user.id]
    );
    res.json({ success: true, data: { logo: logoPath } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==================== TRANSACTIONS ====================
app.get("/api/transactions", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page) || 1);
    const limit = [10, 25, 50, 100].includes(toInt(req.query.limit)) ? toInt(req.query.limit) : 10;
    const search = sanitize(req.query.search) || "";
    const offset = (page - 1) * limit;
    const amilId = req.user.role === "AMIL" ? req.user.id : (req.query.amil_id ? toInt(req.query.amil_id) : null);
    const { clause: dateClause, params: dateParams } = buildDateFilter(
      req.query.filter || "month",
      req.query.date_from,
      req.query.date_to
    );

    let where = "WHERE 1=1";
    const params = [...dateParams];
    if (amilId) { where += " AND t.amil_id = ?"; params.push(amilId); }
    if (search) {
      where += " AND (t.code LIKE ? OR m.name LIKE ? OR m.phone LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (req.query.status) { where += " AND t.status = ?"; params.push(req.query.status); }

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions t JOIN muzakki m ON t.muzakki_id = m.id ${where}`,
      params
    );
    const [rows] = await pool.query(
      `SELECT t.*, m.name AS muzakki_name, m.phone AS muzakki_phone, u.name AS amil_name
       FROM transactions t
       JOIN muzakki m ON t.muzakki_id = m.id
       JOIN users u ON t.amil_id = u.id
       ${where}
       ORDER BY t.transaction_date DESC
       ${paginateSql(limit, offset)}`,
      params
    );
    res.json({ success: true, data: rows, pagination: paginationMeta(page, limit, countRows[0].total) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, m.name AS muzakki_name, m.phone AS muzakki_phone, m.address AS muzakki_address,
              u.name AS amil_name, r.printed_at
       FROM transactions t
       JOIN muzakki m ON t.muzakki_id = m.id
       JOIN users u ON t.amil_id = u.id
       LEFT JOIN receipts r ON r.transaction_id = t.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    if (req.user.role === "AMIL" && rows[0].amil_id !== req.user.id) return res.status(403).json({ success: false, message: "Akses ditolak" });
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/transactions", authMiddleware, roleMiddleware("AMIL"), async (req, res) => {
  try {
    const {
      muzakki_name, muzakki_phone, muzakki_address,
      fitrah_jiwa, rice_price_per_jiwa, fitrah_rice_kg,
      maal, fidyah, infaq, payment,
    } = req.body;

    if (!muzakki_name || !muzakki_phone) return res.status(400).json({ success: false, message: "Nama dan HP muzakki wajib diisi" });

    const jiwa = toInt(fitrah_jiwa);
    const ricePrice = toNum(rice_price_per_jiwa) || toNum(await getSetting("rice_price_per_jiwa"));
    const fitrahMoney = jiwa * ricePrice;
    const fitrahRice = toNum(fitrah_rice_kg);
    const maalAmt = toNum(maal);
    const fidyahAmt = toNum(fidyah);
    const infaqAmt = toNum(infaq);
    const grandTotal = fitrahMoney + maalAmt + fidyahAmt + infaqAmt;
    const paymentAmt = toNum(payment);
    const changeMoney = paymentAmt - grandTotal;

    if (paymentAmt < grandTotal) return res.status(400).json({ success: false, message: "Pembayaran kurang dari total" });

    let muzakkiId;
    const [existing] = await pool.query("SELECT id FROM muzakki WHERE phone = ?", [sanitize(muzakki_phone)]);
    if (existing.length) {
      muzakkiId = existing[0].id;
      await pool.query("UPDATE muzakki SET name = ?, address = ? WHERE id = ?", [sanitize(muzakki_name), sanitize(muzakki_address || ""), muzakkiId]);
    } else {
      const [mResult] = await pool.query("INSERT INTO muzakki (name, phone, address) VALUES (?, ?, ?)", [sanitize(muzakki_name), sanitize(muzakki_phone), sanitize(muzakki_address || "")]);
      muzakkiId = mResult.insertId;
    }

    const code = await generateTransactionCode();
    const [result] = await pool.query(
      `INSERT INTO transactions (code, muzakki_id, amil_id, fitrah_jiwa, rice_price_per_jiwa, fitrah_money, fitrah_rice_kg, maal, fidyah, infaq, grand_total, payment, change_money)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, muzakkiId, req.user.id, jiwa, ricePrice, fitrahMoney, fitrahRice, maalAmt, fidyahAmt, infaqAmt, grandTotal, paymentAmt, changeMoney]
    );

    await auditLog(req.user.id, "CREATE", "transactions", result.insertId, `Buat transaksi ${code}`, req.ip);
    const [tx] = await pool.query(
      `SELECT t.*, m.name AS muzakki_name, m.phone AS muzakki_phone, u.name AS amil_name
       FROM transactions t JOIN muzakki m ON t.muzakki_id = m.id JOIN users u ON t.amil_id = u.id WHERE t.id = ?`,
      [result.insertId]
    );
    res.status(201).json({ success: true, data: tx[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put("/api/transactions/:id", authMiddleware, async (req, res) => {
  try {
    const isAdmin = ["ADMIN", "BENDAHARA"].includes(req.user.role);
    const [existing] = isAdmin
      ? await pool.query("SELECT * FROM transactions WHERE id = ?", [req.params.id])
      : await pool.query("SELECT * FROM transactions WHERE id = ? AND amil_id = ?", [req.params.id, req.user.id]);

    if (!existing.length) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });
    if (!isAdmin && existing[0].status === "PRINTED") {
      return res.status(400).json({ success: false, message: "Transaksi sudah dicetak dan tidak bisa diedit" });
    }

    const {
      muzakki_name, muzakki_phone, muzakki_address,
      fitrah_jiwa, rice_price_per_jiwa, fitrah_rice_kg,
      maal, fidyah, infaq, payment,
    } = req.body;

    const defaultRice = toNum(await getSetting("rice_price_per_jiwa"));
    const amounts = calcTransactionAmounts(
      { fitrah_jiwa, rice_price_per_jiwa, fitrah_rice_kg, maal, fidyah, infaq, payment },
      defaultRice
    );
    if (amounts.paymentAmt < amounts.grandTotal) {
      return res.status(400).json({ success: false, message: "Pembayaran kurang dari total" });
    }

    await pool.query("UPDATE muzakki SET name = ?, phone = ?, address = ? WHERE id = ?", [
      sanitize(muzakki_name), sanitize(muzakki_phone), sanitize(muzakki_address || ""), existing[0].muzakki_id,
    ]);
    await pool.query(
      `UPDATE transactions SET fitrah_jiwa=?, rice_price_per_jiwa=?, fitrah_money=?, fitrah_rice_kg=?, maal=?, fidyah=?, infaq=?, grand_total=?, payment=?, change_money=? WHERE id=?`,
      [
        amounts.jiwa, amounts.ricePrice, amounts.fitrahMoney, amounts.fitrahRice,
        amounts.maalAmt, amounts.fidyahAmt, amounts.infaqAmt, amounts.grandTotal,
        amounts.paymentAmt, amounts.changeMoney, req.params.id,
      ]
    );
    await auditLog(req.user.id, "UPDATE", "transactions", req.params.id, `Update transaksi ${existing[0].code}`, req.ip);
    res.json({ success: true, message: "Transaksi berhasil diupdate" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete("/api/transactions/all", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), async (req, res) => {
  try {
    const [countRows] = await pool.query("SELECT COUNT(*) AS total FROM transactions");
    const total = countRows[0].total;
    if (!total) return res.json({ success: true, message: "Tidak ada transaksi untuk dihapus", data: { deleted: 0 } });

    await pool.query("DELETE FROM receipts");
    await pool.query("DELETE FROM transactions");
    await pool.query("DELETE FROM deposit_bendahara");
    await auditLog(req.user.id, "DELETE", "transactions", null, `Hapus semua transaksi (${total} data) + reset setoran`, req.ip);
    res.json({ success: true, message: `${total} transaksi berhasil dihapus`, data: { deleted: total } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete("/api/transactions/:id", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), async (req, res) => {
  try {
    const [existing] = await pool.query("SELECT * FROM transactions WHERE id = ?", [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });

    await pool.query("DELETE FROM receipts WHERE transaction_id = ?", [req.params.id]);
    await pool.query("DELETE FROM transactions WHERE id = ?", [req.params.id]);
    await auditLog(req.user.id, "DELETE", "transactions", req.params.id, `Hapus transaksi ${existing[0].code}`, req.ip);
    res.json({ success: true, message: "Transaksi berhasil dihapus" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/transactions/:id/print", authMiddleware, async (req, res) => {
  try {
    const isAdmin = ["ADMIN", "BENDAHARA"].includes(req.user.role);
    const [existing] = isAdmin
      ? await pool.query("SELECT * FROM transactions WHERE id = ?", [req.params.id])
      : await pool.query("SELECT * FROM transactions WHERE id = ? AND amil_id = ?", [req.params.id, req.user.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan" });

    if (!isAdmin && existing[0].status !== "PRINTED") {
      await pool.query("UPDATE transactions SET status = 'PRINTED' WHERE id = ?", [req.params.id]);
      await pool.query("INSERT INTO receipts (transaction_id, printed_by) VALUES (?, ?)", [req.params.id, req.user.id]);
      await auditLog(req.user.id, "PRINT", "transactions", req.params.id, "Cetak struk", req.ip);
    } else if (isAdmin && existing[0].status !== "PRINTED") {
      await pool.query("UPDATE transactions SET status = 'PRINTED' WHERE id = ?", [req.params.id]);
      await pool.query(
        "INSERT INTO receipts (transaction_id, printed_by) VALUES (?, ?) ON DUPLICATE KEY UPDATE printed_at = printed_at",
        [req.params.id, req.user.id]
      );
    }

    const [tx] = await pool.query(
      `SELECT t.*, m.name AS muzakki_name, m.phone AS muzakki_phone, u.name AS amil_name, r.printed_at
       FROM transactions t JOIN muzakki m ON t.muzakki_id = m.id JOIN users u ON t.amil_id = u.id
       LEFT JOIN receipts r ON r.transaction_id = t.id WHERE t.id = ?`,
      [req.params.id]
    );

    const settings = {};
    const [settingRows] = await pool.query("SELECT setting_key, setting_value FROM settings");
    settingRows.forEach((r) => { settings[r.setting_key] = r.setting_value; });

    res.json({ success: true, data: { transaction: tx[0], settings } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Public QR verification
app.get("/api/verify/:code", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.code, t.transaction_date, t.grand_total, t.status, m.name AS muzakki_name, u.name AS amil_name, r.printed_at
       FROM transactions t JOIN muzakki m ON t.muzakki_id = m.id JOIN users u ON t.amil_id = u.id
       LEFT JOIN receipts r ON r.transaction_id = t.id WHERE t.code = ?`,
      [req.params.code]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: "Transaksi tidak ditemukan", valid: false });
    res.json({
      success: true,
      valid: rows[0].status === "PRINTED",
      data: {
        status: rows[0].status === "PRINTED" ? "Valid" : "Belum Dicetak",
        muzakki_name: rows[0].muzakki_name,
        transaction_date: rows[0].transaction_date,
        grand_total: rows[0].grand_total,
        amil_name: rows[0].amil_name,
        code: rows[0].code,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==================== DEPOSITS ====================
app.get("/api/deposits", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page) || 1);
    const limit = [10, 25, 50, 100].includes(toInt(req.query.limit)) ? toInt(req.query.limit) : 10;
    const offset = (page - 1) * limit;
    const amilId = req.user.role === "AMIL" ? req.user.id : (req.query.amil_id ? toInt(req.query.amil_id) : null);

    let where = "WHERE 1=1";
    const params = [];
    if (amilId) { where += " AND d.amil_id = ?"; params.push(amilId); }

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM deposit_bendahara d ${where}`, params);
    const [rows] = await pool.query(
      `SELECT d.*, u.name AS amil_name, v.name AS verified_by_name
       FROM deposit_bendahara d
       JOIN users u ON d.amil_id = u.id
       LEFT JOIN users v ON d.verified_by = v.id
       ${where} ORDER BY d.created_at DESC ${paginateSql(limit, offset)}`,
      params
    );
    res.json({ success: true, data: rows, pagination: paginationMeta(page, limit, countRows[0].total) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/deposits/balance", authMiddleware, roleMiddleware("AMIL"), async (req, res) => {
  try {
    const balance = await getAmilBalance(req.user.id);
    res.json({ success: true, data: balance });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/deposits", authMiddleware, roleMiddleware("AMIL"), async (req, res) => {
  try {
    const amount = toNum(req.body.amount);
    const bendaharaPassword = req.body.bendahara_password;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: "Nominal setor tidak valid" });
    if (!bendaharaPassword) return res.status(400).json({ success: false, message: "Password bendahara wajib diisi" });

    const [bendahara] = await pool.query("SELECT * FROM users WHERE role IN ('BENDAHARA', 'ADMIN') AND is_active = 1 LIMIT 1");
    if (!bendahara.length) return res.status(400).json({ success: false, message: "Bendahara tidak ditemukan" });

    const valid = await bcrypt.compare(bendaharaPassword, bendahara[0].password);
    if (!valid) return res.status(401).json({ success: false, message: "Password bendahara salah" });

    const balance = await getAmilBalance(req.user.id);
    if (amount > balance.balance) return res.status(400).json({ success: false, message: "Saldo tidak mencukupi" });

    const [result] = await pool.query(
      "INSERT INTO deposit_bendahara (amil_id, amount, verified_by, status) VALUES (?, ?, ?, 'VERIFIED')",
      [req.user.id, amount, bendahara[0].id]
    );
    await auditLog(req.user.id, "DEPOSIT", "deposit_bendahara", result.insertId, `Setor Rp${amount}`, req.ip);
    res.status(201).json({ success: true, message: "Setoran berhasil", data: { id: result.insertId } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==================== DASHBOARD ====================
app.get("/api/dashboard/amil", authMiddleware, roleMiddleware("AMIL"), async (req, res) => {
  try {
    const amilId = req.user.id;
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const summaryToday = async (start) => {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS total_transactions,
                COALESCE(SUM(fitrah_money), 0) AS total_fitrah_money,
                COALESCE(SUM(fitrah_rice_kg), 0) AS total_fitrah_rice,
                COALESCE(SUM(maal), 0) AS total_maal,
                COALESCE(SUM(fidyah), 0) AS total_fidyah,
                COALESCE(SUM(infaq), 0) AS total_infaq
         FROM transactions WHERE amil_id = ? AND status = 'PRINTED' AND transaction_date >= ?`,
        [amilId, start]
      );
      return rows[0];
    };

    const [monthTotal] = await pool.query(
      "SELECT COALESCE(SUM(grand_total), 0) AS total FROM transactions WHERE amil_id = ? AND status = 'PRINTED' AND transaction_date >= ?",
      [amilId, monthStart]
    );
    const balance = await getAmilBalance(amilId);

    res.json({
      success: true,
      data: {
        today: await summaryToday(todayStart),
        month: { total_received: parseFloat(monthTotal[0].total), ...balance },
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/dashboard/admin", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), async (req, res) => {
  try {
    const { clause, params } = buildDateFilter(req.query.filter || "month", req.query.date_from, req.query.date_to);

    const [receipts] = await pool.query(
      `SELECT COALESCE(SUM(fitrah_money), 0) AS fitrah_money,
              COALESCE(SUM(fitrah_rice_kg), 0) AS fitrah_rice,
              COALESCE(SUM(maal), 0) AS maal,
              COALESCE(SUM(fidyah), 0) AS fidyah,
              COALESCE(SUM(infaq), 0) AS infaq,
              COALESCE(SUM(grand_total), 0) AS grand_total,
              COUNT(*) AS total_transactions
       FROM transactions t WHERE status = 'PRINTED' ${clause}`,
      params
    );

    const [perAmil] = await pool.query(
      `SELECT u.id, u.name, COALESCE(SUM(t.grand_total), 0) AS total
       FROM users u LEFT JOIN transactions t ON u.id = t.amil_id AND t.status = 'PRINTED' ${clause.replace(/t\./g, "t.")}
       WHERE u.role = 'AMIL' AND u.is_active = 1
       GROUP BY u.id, u.name ORDER BY total DESC`,
      params
    );

    const orgStats = await getOrgDepositStats();

    res.json({
      success: true,
      data: {
        summary: receipts[0],
        per_amil: perAmil,
        total_deposited: orgStats.total_deposited,
        total_held_by_amil: orgStats.total_held_by_amil,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==================== REPORTS ====================
app.get("/api/reports/amil", authMiddleware, roleMiddleware("AMIL"), async (req, res) => {
  try {
    const { clause, params } = buildDateFilter(req.query.filter, req.query.date_from, req.query.date_to);
    const amilId = req.user.id;

    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(fitrah_money), 0) AS zakat_uang,
              COALESCE(SUM(fitrah_rice_kg), 0) AS zakat_beras,
              COALESCE(SUM(maal), 0) AS zakat_maal,
              COALESCE(SUM(fidyah), 0) AS fidyah,
              COALESCE(SUM(infaq), 0) AS infaq,
              COALESCE(SUM(grand_total), 0) AS total_keseluruhan
       FROM transactions t WHERE amil_id = ? AND status = 'PRINTED' ${clause}`,
      [amilId, ...params]
    );
    const balance = await getAmilBalance(amilId);
    res.json({ success: true, data: { ...rows[0], saldo_amil: balance.balance, saldo_bendahara: balance.totalDeposited } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/reports/admin/amil", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), async (req, res) => {
  try {
    const { clause, params } = buildDateFilter(req.query.filter, req.query.date_from, req.query.date_to);
    const [rows] = await pool.query(
      `SELECT u.id, u.name,
              COALESCE(SUM(t.grand_total), 0) AS total
       FROM users u LEFT JOIN transactions t ON u.id = t.amil_id AND t.status = 'PRINTED' ${clause.replace(/t\.transaction_date/g, "t.transaction_date")}
       WHERE u.role = 'AMIL' AND u.is_active = 1
       GROUP BY u.id, u.name ORDER BY total DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/reports/admin/amil/:id", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), async (req, res) => {
  try {
    const amilId = req.params.id;
    const { clause, params } = buildDateFilter(req.query.filter, req.query.date_from, req.query.date_to);

    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(fitrah_money), 0) AS zakat_uang,
              COALESCE(SUM(fitrah_rice_kg), 0) AS zakat_beras,
              COALESCE(SUM(maal), 0) AS zakat_maal,
              COALESCE(SUM(fidyah), 0) AS fidyah,
              COALESCE(SUM(infaq), 0) AS infaq,
              COALESCE(SUM(grand_total), 0) AS total_keseluruhan
       FROM transactions t WHERE amil_id = ? AND status = 'PRINTED' ${clause}`,
      [amilId, ...params]
    );
    const balance = await getAmilBalance(amilId);
    const [amil] = await pool.query("SELECT id, name FROM users WHERE id = ?", [amilId]);
    res.json({ success: true, data: { amil: amil[0], report: { ...rows[0], saldo_amil: balance.balance, saldo_bendahara: balance.totalDeposited } } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/reports/admin/rekap", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), async (req, res) => {
  try {
    const { clause, params } = buildDateFilter(req.query.filter, req.query.date_from, req.query.date_to);
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(fitrah_money), 0) AS zakat_uang,
              COALESCE(SUM(fitrah_rice_kg), 0) AS zakat_beras,
              COALESCE(SUM(maal), 0) AS zakat_maal,
              COALESCE(SUM(fidyah), 0) AS fidyah,
              COALESCE(SUM(infaq), 0) AS infaq,
              COALESCE(SUM(grand_total), 0) AS total_keseluruhan
       FROM transactions t WHERE status = 'PRINTED' ${clause}`,
      params
    );
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==================== AUDIT LOGS ====================
app.get("/api/audit-logs", authMiddleware, roleMiddleware("ADMIN", "BENDAHARA"), async (req, res) => {
  try {
    const page = Math.max(1, toInt(req.query.page) || 1);
    const limit = [10, 25, 50, 100].includes(toInt(req.query.limit)) ? toInt(req.query.limit) : 10;
    const offset = (page - 1) * limit;
    const search = sanitize(req.query.search) || "";

    let where = "WHERE 1=1";
    const params = [];
    if (search) { where += " AND (a.description LIKE ? OR u.name LIKE ? OR a.action LIKE ?)"; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ${where}`, params);
    const [rows] = await pool.query(
      `SELECT a.*, u.name AS user_name FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ${where} ORDER BY a.created_at DESC ${paginateSql(limit, offset)}`,
      params
    );
    res.json({ success: true, data: rows, pagination: paginationMeta(page, limit, countRows[0].total) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==================== BACKUP ====================
app.post("/api/backup", authMiddleware, roleMiddleware("ADMIN"), async (req, res) => {
  try {
    const tables = ["users", "muzakki", "transactions", "deposit_bendahara", "receipts", "settings", "audit_logs"];
    const backup = { created_at: new Date().toISOString(), tables: {} };
    for (const table of tables) {
      const [rows] = await pool.query(`SELECT * FROM ${table}`);
      backup.tables[table] = rows;
    }
    const filename = `backup-${Date.now()}.json`;
    fs.writeFileSync(path.join(__dirname, "backups", filename), JSON.stringify(backup, null, 2));
    await auditLog(req.user.id, "BACKUP", "database", null, `Backup ${filename}`, req.ip);
    res.json({ success: true, data: { filename } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get("/api/health", (_, res) => res.json({ success: true, message: "Zakat API running" }));

app.listen(PORT, () => console.log(`Zakat API running on port ${PORT}`));
