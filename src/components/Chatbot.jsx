import React, { useState, useRef, useEffect } from "react";
import "../styles/ChatBot.css";
import ReactMarkdown from "react-markdown";

const ChatBot = () => {
  const [message, setMessage] = useState(""); // Store the current user message
  const [chatMessages, setChatMessages] = useState([]); // Store all chat messages (both user and AI)
  const [isLoading, setIsLoading] = useState(false); // Handle loading state
  const textareaRef = useRef(null); // Reference for the textarea

  // Adjust textarea height based on its content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // Reset height to calculate scrollHeight
      textarea.style.height = `${textarea.scrollHeight}px`; // Set height based on scrollHeight
    }
  };

  // Handle user message input change
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  // Handle message send
  const handleSendMessage = async () => {
    if (message.trim() === "") return; // Prevent sending empty messages

    const newMessage = { content: message, sender: "user" };
    const updatedChatMessages = [...chatMessages, newMessage];
    setChatMessages(updatedChatMessages); 
    setMessage(""); 
    adjustTextareaHeight(); // Adjust height after sending message

    setIsLoading(true); 

    try {
      // Send message to backend API
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: updatedChatMessages 
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

  useEffect(() => {
    adjustTextareaHeight();
  }, []);


  return (
    <div className="chat-container">
      <div className="chat-window">
        {chatMessages.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.sender}`}>
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}
        {isLoading && <div className="chat-bubble robot">AI is typing...</div>} {/* Display loading text */}
      </div>

      {/* Input area */}
      <div className="input-container">
        <textarea
          ref={textareaRef} // Attach ref to textarea
          value={message}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} disabled={isLoading}>Send</button>
      </div>
    </div>
  );
};

export default ChatBot;