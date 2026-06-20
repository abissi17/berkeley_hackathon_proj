import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../api/compassApi";

export default function ChatTab({ sessionId }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm your Compass assistant. I can help with questions about your child's roadmap, therapy options, legal rights, insurance, and what to expect during evaluations. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // Add user message immediately
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(sessionId, text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I ran into a problem. Please try asking again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-20rem)] min-h-[32rem]">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Ask Compass</h2>
      <p className="text-sm text-gray-500 mb-4">
        Ask follow-up questions about your child's care plan. I know your
        child's profile and can give you specific guidance.
      </p>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 border border-gray-200 rounded-xl bg-gray-50 p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-compass-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-400">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ask something like "How do I request an evaluation?"'
          disabled={loading}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm
                     focus:border-compass-500 focus:ring-1 focus:ring-compass-500
                     outline-none transition disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary !py-2 !px-4"
        >
          Send
        </button>
      </form>

      <p className="mt-2 text-xs text-gray-400">
        Compass assistant · Replies are AI-generated · Not a substitute for
        professional medical advice
      </p>
    </div>
  );
}
