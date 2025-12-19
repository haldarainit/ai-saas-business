// Simple test script to check auth API from command line
fetch('http://localhost:3000/api/auth/me', {
  method: 'GET',
  credentials: 'include',
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response:', data);
})
.catch(error => {
  console.error('Error:', error);
});