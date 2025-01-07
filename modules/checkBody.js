// Middleware pour checker si les champs sont remplis lors du sing in / sign up
function checkBody(body, keys) {
  let isValid = true;

  for (const field of keys) {
    if (!body[field] || body[field] === "") {
      isValid = false;
    }
  }

  return isValid;
}

module.exports = { checkBody };
