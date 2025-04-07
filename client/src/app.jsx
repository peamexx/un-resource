import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const upload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("folder", file);

    const res = await axios.post("http://localhost:3001/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setResult(res.data);
  };

  return (
    <>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={upload}>upload</button>
      {result && (
        <>
          <h2>Missing Resources</h2>
          <ul>{result.missing.map((r, i) => <li key={i}>{r}</li>)}</ul>

          <h2>Unused Files</h2>
          <ul>{result.unused.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </>
      )}
    </>
  );
}

export default App;
