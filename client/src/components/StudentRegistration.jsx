import React, { useState } from 'react';
import '../styles/StudentRegistration.css';

const API_URL = import.meta.env.VITE_API_URL;

const StudentRegistration = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    university: '',
    major: '',
    graduationYear: '',
    phoneNumber: '',
    preferredContact: 'email'
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/students/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Registration successful! Thank you for registering.');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          studentId: '',
          university: '',
          major: '',
          graduationYear: '',
          phoneNumber: '',
          preferredContact: 'email'
        });
      } else {
        setMessage('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <h2>Student Registration</h2>
      
      {message && (
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-group">
          <label htmlFor="firstName">First Name *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="studentId">Student ID *</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="university">University *</label>
          <select
            id="university"
            name="university"
            value={formData.university}
            onChange={handleChange}
            required
          >
            <option value="">Select University</option>
            <option value="University of Washington">University of Washington</option>
            <option value="Seattle University">Seattle University</option>
            <option value="Seattle Pacific University">Seattle Pacific University</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="major">Major *</label>
          <input
            type="text"
            id="major"
            name="major"
            value={formData.major}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="graduationYear">Expected Graduation Year *</label>
          <input
            type="number"
            id="graduationYear"
            name="graduationYear"
            min={new Date().getFullYear()}
            max={new Date().getFullYear() + 6}
            value={formData.graduationYear}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
            placeholder="123-456-7890"
          />
        </div>

        <div className="form-group">
          <label>Preferred Contact Method *</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="preferredContact"
                value="email"
                checked={formData.preferredContact === 'email'}
                onChange={handleChange}
              />
              Email
            </label>
            <label>
              <input
                type="radio"
                name="preferredContact"
                value="phone"
                checked={formData.preferredContact === 'phone'}
                onChange={handleChange}
              />
              Phone
            </label>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default StudentRegistration; 