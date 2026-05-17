const images = [];

const req = require.context('/src/assets/images/hero', false, /\.(png|jpe?g|svg)$/);

req.keys().forEach((key) => {
  images.push({
    original: req(key),
    thumbnail: req(key),
  });
});

export default images;