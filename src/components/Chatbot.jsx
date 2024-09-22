import React, { useState } from "react";
import "../styles/ChatBot.css";

const ChatBot = () => {
  const [message, setMessage] = useState(""); // Store the current user message
  const [chatMessages, setChatMessages] = useState([]); // Store all chat messages (both user and AI)
  const [isLoading, setIsLoading] = useState(false); // Handle loading state

  const userId = "your-user-id"; // Replace this with the actual user ID

  // Handle user message input change
  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  // Handle message send
  const handleSendMessage = async () => {
    if (message.trim() === "") return; // Prevent sending empty messages

    const newMessage = { content: message, sender: "user" };
    setChatMessages([...chatMessages, newMessage]); 
    setMessage(""); 

    setIsLoading(true); 

    try {
      // Send message to backend API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          user_id: userId, // Send user_id with the message
        }),
      });

      const data = await response.json();

      if (response.ok && data.response) {
       
        const aiMessage = { content: data.response, sender: "robot" };
        setChatMessages((prevMessages) => [...prevMessages, aiMessage]);
      } else {
        // Handle errors returned from the backend
        const errorMessage = { content: data.error || "Error from the server", sender: "robot" };
        setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      console.error("Failed to fetch chat response:", error);
      // Handle network or API errors
      const errorMessage = { content: "Failed to reach the server. Please try again later.", sender: "robot" };
      setChatMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        
        {chatMessages.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.sender}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="chat-bubble robot">AI is typing...</div>} {/* Display loading text */}
      </div>

      {/* Input area */}
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={isLoading} 
        />
        <button onClick={handleSendMessage} disabled={isLoading}>Send</button>
      </div>
    </div>
  );
};

export default ChatBot;