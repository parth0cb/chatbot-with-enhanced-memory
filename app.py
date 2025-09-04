from flask import Flask, render_template, request, redirect, session, url_for
from openai import OpenAI
import re
import markdown
import bleach

app = Flask(__name__)
app.secret_key = "secret"


MEMORY_TAG_RE = re.compile(r"<append_to_memory>(.*?)</append_to_memory>", re.DOTALL)

def extract_memory(text):
    """Extract content inside <append_to_memory> tags."""
    matches = MEMORY_TAG_RE.findall(text)
    return [m.strip() for m in matches]

def remove_memory_tags(text):
    """Remove <append_to_memory>...</append_to_memory> tags from text."""
    return MEMORY_TAG_RE.sub("", text).strip()

def escape_outside_code_blocks(text):
    result = []
    in_fenced_block = False
    fenced_delim = "```"

    for line in text.splitlines():
        if line.strip().startswith(fenced_delim):
            in_fenced_block = not in_fenced_block
            result.append(line)
            continue

        if not in_fenced_block:
            
            line = _escape_outside_inline_code(line)
        result.append(line)

    return '\n'.join(result)

def _escape_outside_inline_code(line):
    """
    Escape text outside of inline code spans (`code`)
    """
    parts = re.split(r'(`[^`]*`)', line)  
    for i, part in enumerate(parts):
        if not part.startswith('`'):  
            parts[i] = bleach.clean(part)
    return ''.join(parts)


# ===


@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        session.clear()
        session["api_key"] = request.form["api_key"].strip()
        session["base_url"] = request.form["base_url"].strip()
        session["model_name"] = request.form["model_name"].strip()

        
        session["chat_history"] = []
        session["memory_timeline"] = []

        return redirect(url_for("chat"))
    return render_template("index.html")

@app.route("/chat", methods=["GET", "POST"])
def chat():
    if not all(k in session for k in ("api_key", "base_url", "model_name")):
        return redirect(url_for("index"))

    api_key = session["api_key"]
    base_url = session["base_url"]
    model_name = session["model_name"]

    
    chat_history = session.get("chat_history", [])
    memory_timeline = session.get("memory_timeline", [])

    
    long_term_memory_text = "\n".join(memory_timeline)


    system_prompt = f"""
You are a helpful assistant with access to long-term memory. Use the following long-term memories to improve your responses:
{long_term_memory_text}

===

When encountering new information during the conversation, consider whether it meets all of the following criteria **before** deciding to save it:

Save the information (inside <append_to_memory> tags) only if:
- It is new information you did not know.
- It is likely to be useful or referenced in future conversations
- It corrects a misunderstanding or provides a clarification for future accuracy
- It is a specific request from the user to remember something

Do NOT save information that is:
- General knowledge you already know
- Trivial, obvious, or fleeting comments
- Redundant with what's already saved in memory
- Sensitive unless explicitly requested

Only save when there's clear, long-term value. If in doubt, do NOT save.

Correct usage example:
<append_to_memory>User prefers concise answers and dislikes emojis.</append_to_memory>

Incorrect usage examples:
<append_to_memory>Hello, how are you?</append_to_memory>
<append_to_memory>The sky is blue.</append_to_memory>

===

Always be thoughtful and minimal when deciding to save. Your responses should remain clear, concise, and helpful.
"""

    
    short_term_history = chat_history[-10:]

    if request.method == "POST":
        user_message = request.form["message"].strip()
        if user_message:
            
            chat_history.append(("User", user_message))

            
            
            messages = [{"role": "system", "content": system_prompt}]
            
            for role, msg in short_term_history:
                role_lower = "assistant" if role == "Assistant" else "user"
                messages.append({"role": role_lower, "content": msg})
            
            messages.append({"role": "user", "content": user_message})

            
            client = OpenAI(api_key=api_key)
            client.base_url = base_url  

            
            response = client.chat.completions.create(
                model=model_name,
                messages=messages
            )

            assistant_message = response.choices[0].message.content

            
            new_memories = extract_memory(assistant_message)
            
            if new_memories:
                memory_timeline.extend(new_memories)
            
            assistant_message_clean = remove_memory_tags(assistant_message)
            
            chat_history.append(("Assistant", assistant_message_clean))
            
            session["chat_history"] = chat_history
            session["memory_timeline"] = memory_timeline

            return redirect(url_for("chat"))

    chat_history_rendered = []
    for role, msg in chat_history:
        if role == "Assistant":
            msg_clean = escape_outside_code_blocks(msg)
            msg_html = markdown.markdown(msg_clean, extensions=['fenced_code'])
            chat_history_rendered.append((role, msg_html))
        else:
            chat_history_rendered.append((role, msg))

    return render_template(
        "chat.html",
        chat_history=chat_history_rendered,
        memory_timeline=memory_timeline,
    )

@app.route("/reset")
def reset():
    api_key = session.get("api_key")
    base_url = session.get("base_url")
    model_name = session.get("model_name")

    session.clear()

    if api_key and base_url and model_name:
        session["api_key"] = api_key
        session["base_url"] = base_url
        session["model_name"] = model_name

    session["chat_history"] = []
    session["memory_timeline"] = []

    return redirect(url_for("chat"))


if __name__ == "__main__":
    app.run(debug=True)
