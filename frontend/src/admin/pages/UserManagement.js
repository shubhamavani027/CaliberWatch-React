import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Button, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

import { adminAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import './AdminDashboard.css';

function UserManagement() {
  const navigate = useNavigate();
  const { admin, loading: authLoading } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!authLoading && !admin) navigate('/admin');
  }, [admin, authLoading, navigate]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getAllUsers();
        setUsers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        Swal.fire('Error', 'Failed to load users', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && admin) {
      loadUsers();
    }
  }, [admin, authLoading]);

  const filteredUsers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) =>
      [user.name, user.email, user.role].some((v) =>
        String(v || '').toLowerCase().includes(q)
      )
    );
  }, [users, searchText]);

  const handleDeleteUser = async (userId, userName) => {
    const confirmed = await Swal.fire({
      title: 'Delete User?',
      text: `Are you sure you want to delete ${userName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
    });

    if (confirmed.isConfirmed) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers((currentUsers) => currentUsers.filter((u) => u.id !== userId));
        Swal.fire('Success', 'User deleted successfully', 'success');
      } catch (error) {
        Swal.fire('Error', 'Failed to delete user', 'error');
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="admin-dashboard">
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
          <Spinner />
        </Container>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Container fluid className="admin-container">
        <h2>User Management</h2>

        <Card className="dashboard-card">
          <Card.Header className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <b>Users ({filteredUsers.length})</b>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <input
                type="text"
                className="search-input"
                placeholder="Search users..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: '200px' }}
              />
            </div>
          </Card.Header>

          <Card.Body>
            <div style={{ overflowX: 'auto' }}>
              <Table hover size="sm" responsive className="dashboard-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.70)' }}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name || 'N/A'}</td>
                        <td>{user.email}</td>
                        <td>
                          <Badge bg="warning">{user.role}</Badge>
                        </td>
                        <td>
                          <Badge bg={user.verified ? 'success' : 'warning'}>
                            {user.verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={user.role === 'admin'}
                            title={user.role === 'admin' ? 'Cannot delete admin users' : 'Delete user'}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

export default UserManagement;

