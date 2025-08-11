import React, { useEffect } from 'react';

export default function FlashMessages({ messages }) {
  useEffect(() => {
    const timers = document.querySelectorAll('.alert');
    timers.forEach(alert => {
      setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.remove();
        }, 2000);
      }, 1000); // Auto-dismiss after 1 second
    });
  }, [messages]);

  if (!messages || messages.length === 0) return null;

  return (
    <div>
      {messages.map((msg, index) => (
        <div
          key={index}
          className="alert alert-dismissible fade show"
          role="alert"
          style={{
            backgroundColor: 'white',
            color: 'black',
            padding: '10px',
            marginRight: '5px',
            zIndex: 2000,
            opacity: 0.8,
            position: 'fixed',
            right: 0,
          }}
        >
          {msg[0] === 'danger' ? (
            <i className="bx bx-error-circle" style={{ color: 'red', marginRight: '5px' }}></i>
          ) : (
            <i className="bx bx-check-circle" style={{ color: 'lawngreen', marginRight: '5px' }}></i>
          )}
          {msg[1]}
        </div>
      ))}
    </div>
  );
}
