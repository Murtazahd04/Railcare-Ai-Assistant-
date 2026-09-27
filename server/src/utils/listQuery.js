/** Generic list helper: ?search=&page=&limit=&sort= */
async function listWithQuery(Model, req, searchFields = []) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const filter = {};

  if (req.query.search && searchFields.length) {
    filter.$or = searchFields.map((f) => ({ [f]: { $regex: req.query.search, $options: "i" } }));
  }
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Model.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

module.exports = { listWithQuery };
