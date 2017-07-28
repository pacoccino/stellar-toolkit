const StellarError = (code, message) => (detail) => {
  return {
    code,
    message,
    detail,
    customError: true,
  };
};

const ERRORS = {
  ACCOUNT_NO_SEEDDATA: StellarError(422, 'Account does not hold encrypted seed in data.'),
  INVALID_PASSWORD:    StellarError(401, 'Bad credentials'),
  ACCOUNT_NOT_EXIST:   StellarError(404, 'Account does not exists'),
  BAD_PARAMETERS:      StellarError(400, 'Bad parameters'),
  UNAUTHORIZED:        StellarError(403, 'Unauthorized'),
};

module.exports = {
  ERRORS,
  StellarError,
};
