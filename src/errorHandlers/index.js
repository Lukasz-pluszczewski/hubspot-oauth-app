const errorHandlers = [
  (error) => {
    return {
      status: 500,
      body: {
        message: error.message,
        originalError: error,
      },
    };
  },
];

export default errorHandlers