// Tells the page whether the backend is running and whether the key is set.
// It never returns the key itself.
module.exports = (req, res) => {
  res.status(200).json({ ok: true, keyConfigured: Boolean(process.env.SARVAM_API_KEY) });
};
