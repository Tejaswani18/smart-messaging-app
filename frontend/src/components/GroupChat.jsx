import { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useParams, useNavigate } from 'react-router-dom';

const socket = io('http://localhost:5000');

function GroupChat() {
  const { groupId } = useParams();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [group, setGroup] = useState(null);
  const [newMemberEmails, setNewMemberEmails] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('groupchat-page');
    return () => {
      document.body.classList.remove('groupchat-page');
    };
  }, []);

  useEffect(() => {
  const fetchGroupAndMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');
      console.log('Fetching group and messages for groupId:', groupId);

      const groupRes = await axios.get(`http://localhost:5000/api/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Group fetched:', groupRes.data);
      setGroup(groupRes.data);

      const messagesRes = await axios.get(`http://localhost:5000/api/messages/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Messages fetched:', messagesRes.data);
      setMessages(messagesRes.data);
    } catch (error) {
      console.error('Error fetching group or messages:', error);
      alert('Failed to load group or messages: ' + (error.message || 'Unknown error'));
    }
  };
  fetchGroupAndMessages();

  socket.emit('joinGroup', groupId);
  socket.on('message', (msg) => {
    setMessages((prev) => [...prev, msg]);
  });
  return () => socket.off('message');
}, [groupId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/messages', {
        groupId,
        content: message,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket.emit('sendMessage', res.data.message);
      if (res.data.autoResponse) {
        socket.emit('sendMessage', res.data.autoResponse);
      }
      setMessage('');
    } catch (error) {
      console.error(error);
      alert('Failed to send message');
    }
  };

  const handleAddMembers = async (e) => {
    e.preventDefault();
    if (!newMemberEmails.trim()) {
      alert('Please enter at least one email');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const emailsArray = newMemberEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email);
      const res = await axios.post(
        `http://localhost:5000/api/groups/${groupId}/add-members`,
        { memberEmails: emailsArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroup(res.data); // Update the group with new members
      setNewMemberEmails(''); // Reset the input
    } catch (error) {
      console.error('Error adding members:', error);
      alert('Failed to add members: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    }
  };

  if (!group) return <div>Loading...</div>;

  return (
    <div className="container">
      <h2>{group.name}</h2>
      <button onClick={() => navigate('/dashboard')} className="back-btn">
        Back to Dashboard
      </button>
      <div className="members-section">
        <h3>Members</h3>
        <p>{group.members.map(member => member.email).join(', ')}</p>
        <form onSubmit={handleAddMembers} className="add-members-form">
          <input
            type="text"
            placeholder="Add member emails (comma-separated)"
            value={newMemberEmails}
            onChange={(e) => setNewMemberEmails(e.target.value)}
          />
          <button type="submit">Add Members</button>
        </form>
      </div>
      <div className="chat-box">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.isHighlighted ? 'highlighted' : ''}`}
          >
            <strong>{msg.senderId.username}: </strong>
            {msg.content}
            <span className="timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="chat-form">
        <input
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default GroupChat;