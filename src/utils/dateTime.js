export const getFormattedDate = () => {
  const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date().toLocaleDateString('en-US', dateOptions);
};

export const getFormattedTime = () => {
  const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  return new Date().toLocaleTimeString('en-US', timeOptions);
};

// new Date()
// gives current system date & time
// Example:
// Fri Jun 19 2026

// .toLocaleDateString('en-US', dateOptions)
// converts date into readable format using US style