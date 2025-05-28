// mockApi.js
const mockVerifyNIN = async (nin, firstName, lastName, dateOfBirth) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
  
    // Mock logic
    if (nin === '12345678901' && firstName === 'John' && lastName === 'Doe') {
      return {
        status: 'success',
        data: {
          nin,
          firstName,
          lastName,
          dateOfBirth,
          verified: true
        }
      };
    } else if (nin === '00000000000') {
      throw new Error('Invalid NIN');
    } else {
      return {
        status: 'success',
        data: {
          nin,
          firstName,
          lastName,
          dateOfBirth,
          verified: false
        }
      };
    }
  };
  
  module.exports = { mockVerifyNIN };