const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};


const isValidTitle = function (title) {
  return ["Mr", "Mrs", "Miss"].includes(title);
};

const isExcerpt = function (value) {
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};

const isValidRequestBody = function (requestBody) {
  return Object.keys(requestBody).length > 0;
};
const isValidMobile = function (value) {
  const phone = /^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$/
  return phone.test(value)
}
const isValidEmail = function (value) {
  const regexForEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  return regexForEmail.test(value)
}

const regixValidator = function (value) {
  let regex = /^[a-zA-Z]+([\s][a-zA-Z]+)*$/
  return regex.test(value)
}

const isValidPincode = function (pincode) {
  if (/^\+?([1-9]{1})\)?([0-9]{5})$/.test(pincode)) return true
}

const isValidPassword = function (password) {
  if (/^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password)) return true
}

let isValidISBN = function (value) {
  return /^[6-9]{3}\-([\d]{10})$/.test(value)
}
//=================address===========



module.exports = {
  isValid,
  isValidTitle,
  isValidRequestBody,
  isValidMobile,
  isValidEmail,
  regixValidator,
  isValidPincode,
  isValidPassword,
  isValidISBN,
  isExcerpt 
}