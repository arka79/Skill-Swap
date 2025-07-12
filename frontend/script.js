
  let allUsers = [];

  const userList = document.querySelector('.user-list');
  const searchInput = document.querySelector('input[type="text"]');
  const availabilityFilter = document.querySelector('select');
  const searchButton = document.querySelector('.filter-bar .request-btn');

  function createUserCard(user) {
    return `
      <div class="card">
        <div class="profile-photo"></div>
        <div class="card-content">
          <h3>${user.name}</h3>
          <div class="skills">
            <strong>Skills Offered =></strong>
            ${user.offered.map(skill => `<span>${skill}</span>`).join('')}
          </div>
          <div class="skills">
            <strong>Skill Wanted =></strong>
            ${user.wanted.map(skill => `<span>${skill}</span>`).join('')}
          </div>
          <div class="rating">Rating: ${user.rating}/5</div>
        </div>
        <button class="request-btn" onclick="sendRequest('${user.name}')">Request</button>
      </div>
    `;
  }

  function renderUsers(filteredUsers) {
    userList.innerHTML = '';
    if (filteredUsers.length === 0) {
      userList.innerHTML = `<p style="text-align:center;">No users found.</p>`;
      return;
    }
    filteredUsers.forEach(user => {
      userList.innerHTML += createUserCard(user);
    });
  }

  function filterUsers() {
    const searchText = searchInput.value.toLowerCase();
    const selectedAvailability = availabilityFilter.value;

    const filtered = allUsers.filter(user => {
      const allSkills = [...user.offered, ...user.wanted].join(' ').toLowerCase();
      const skillMatch = searchText === '' || allSkills.includes(searchText);
      const availabilityMatch = selectedAvailability === '' || user.availability === selectedAvailability;
      return skillMatch && availabilityMatch;
    });

    renderUsers(filtered);
  }

  function sendRequest(name) {
    alert(`Swap request sent to ${name}`);
  }

  // Fetch from backend
  async function fetchUsers() {
    try {
      const res = await fetch('http://localhost:3000/api/users'); // change to your backend URL
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      allUsers = data;
      renderUsers(allUsers);
    } catch (err) {
      userList.innerHTML = `<p style="color:red; text-align:center;">Error: ${err.message}</p>`;
    }
  }

  // Event listeners
  searchButton.addEventListener('click', filterUsers);
  searchInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') filterUsers();
  });
  availabilityFilter.addEventListener('change', filterUsers);

  // Initial fetch
  fetchUsers();

