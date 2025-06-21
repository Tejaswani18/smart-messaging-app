import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('dashboard-page');
    return () => {
      document.body.classList.remove('dashboard-page');
    };
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');
        const res = await axios.get('http://localhost:5000/api/groups', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(res.data);
      } catch (error) {
        console.error('Fetch groups error:', error);
        alert('Failed to fetch groups: ' + (error.message || 'Unknown error'));
      }
    };
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      console.log('Attempting to create group:', { name: groupName, memberEmails });
      const emailsArray = memberEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email);
      const res = await axios.post(
        'http://localhost:5000/api/groups/create',
        { name: groupName, memberEmails: emailsArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Group created successfully:', res.data);
      setGroups([...groups, res.data]);
      setGroupName('');
      setMemberEmails('');
    } catch (error) {
      console.error('Create group error:', error);
      alert('Failed to create group: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="container">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
      <form onSubmit={handleCreateGroup} className="group-form">
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Member Emails (comma-separated)"
          value={memberEmails}
          onChange={(e) => setMemberEmails(e.target.value)}
        />
        <button type="submit">Create Group</button>
      </form>
      <h3>Your Groups</h3>
      <ul>
        {groups.map(group => (
          <li key={group._id} className="list-item">
            <button onClick={() => navigate(`/group/${group._id}`)}>
              {group.name}
            </button>
            <p style={{ fontSize: '0.9rem', color: '#666' }}>
              Members: {group.members.map(member => member.email).join(', ')}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Dashboard;