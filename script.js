// Example login
async function loginUser(email, password) {
    const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log(data); // save token, etc.
 if (data.token) {
    localStorage.setItem('token', data.token); // keep user logged in
  }
}