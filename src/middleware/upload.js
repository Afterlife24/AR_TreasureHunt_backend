const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({ storage });

module.exports = upload.fields([
  { name: 'markerImage', maxCount: 1 },
  { name: 'clueRenderImage', maxCount: 1 }
]);
