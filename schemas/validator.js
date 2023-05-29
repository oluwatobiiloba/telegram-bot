function validator(spec, data, options = {}) {
  const vOptions = {
    skipFunctions: true,
    stripUnknown: { arrays: true, objects: true },
    errors: {
      wrap: { label: false, array: false, string: false },
    },
    ...options,
  };
  const { error, value } = spec.validate(data, vOptions);
  if (error) throw error;

  return value;
}

module.exports = validator;
