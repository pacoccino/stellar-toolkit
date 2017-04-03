const CustomError = (code, message) => (detail) => {
  return {
    code,
    message,
    detail,
    customError: true,
  };
};

const ERRORS = {
  ACCOUNT_NO_SEEDDATA: CustomError(422, 'Account does not hold encrypted seed in data.'),
  INVALID_PASSWORD:    CustomError(401, 'Bad credentials'),
  ACCOUNT_NOT_EXIST:   CustomError(404, 'Account does not exists'),
  BAD_PARAMETERS:      CustomError(400, 'Bad parameters'),
  UNAUTHORIZED:        CustomError(403, 'Unauthorized'),
};

module.exports = {
  ERRORS,
  CustomError,
};
