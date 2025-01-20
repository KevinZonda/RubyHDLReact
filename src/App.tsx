import ReactCodeMirror from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language';
import { api } from './api'
import './App.css'
import { useState } from 'react'
import { simpleMode } from '@codemirror/legacy-modes/mode/simple-mode';

const defaultCode = 'INCLUDE "prelude.rby". \n\n# Your code here...\ncurrent = VAR x . x $rel (`add` <x,x>).'

function App() {
  const [code, setCode] = useState(localStorage.getItem('code') || defaultCode)
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [taskId, setTaskId] = useState(localStorage.getItem('taskId') || '')
  const [oType, setOType] = useState('')

  const handleClear = () => {
    setTaskId('');
    localStorage.removeItem('taskId');
    localStorage.removeItem('code');
    setCode(defaultCode);
    setInput('');
    setResult('');
    setOType('');
  }

  const updCode = (code : string) => {
    setCode(code);
    localStorage.setItem('code', code);
  }

  const updRst = (rst : string) => {
    setResult(rst + '\nProduced at: ' + new Date().toLocaleString());
  }

  const handleCompile = async () => {
    const id = taskId ? taskId : undefined;
    const response = await api.compile(code, id);
    setTaskId(response.task_id);
    localStorage.setItem('taskId', response.task_id);

    updRst(response.rbs);
    if (response.compile_err) {
      // alert(response.compile_err);
      setOType('Compile Error:');
      updRst(response.compile_err);
      return false;
    }
    setOType('Compile Output:');
    return true;
  }

  const handleRun = async () => {
    if (!await handleCompile()) {
      return;
    }
    const response = await api.run(taskId, input);
    if (response.error) {
      // alert(response.error);
      setOType('Run Error:');
      updRst(response.error);
    }
    updRst(response.output);
    setOType('Run Output:');
  }

  return (
    <div className="code-editor-container" style={{ width: '100%' }}>
      <h1>Imperial Ruby Compiler</h1>
      
      <div className="nav-bar" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div className="task-id">
          Task ID: {taskId ? taskId : 'N/A'}
        </div>
        <div className="button-group">
          <button className="btn-clear" onClick={handleClear}>🧹 Clear</button>
          <button className="btn-build" onClick={handleCompile}>🛠️ Compile</button>
          <button className="btn-play" onClick={handleRun}>▶ Run</button>
        </div>
      </div>
      
      <ReactCodeMirror
        value={code}
        onChange={(value) => updCode(value)}
        placeholder="Enter your code here..."
        extensions={[
          StreamLanguage.define(simpleMode({
            start: [
              {
                regex: /#(.*)/,
                token: "comment"
              },
              {
                regex: /VAR|INCLUDE|IF|THEN|ELSE|IN|END|LET/,
                token: "keyword"
              },
              {
                regex: /\$[a-zA-Z]*/,
                token: "keyword"
              },
              {
                regex: /"(.*)"/,
                token: "string"
              },
              {
                regex: /`[^`]*`/,
                token: "atom"
              },
              {
                regex: /<[^>]*>/,
                token: "number"
              },
              {
                regex: /[0-9]+/,
                token: "number"
              }
            ],
          })),
        ]}
        height="300px"
        basicSetup={{ lineNumbers: true, autocompletion: false, indentOnInput: false }}
        style={{
          border: '1px solid #ccc',
        }}
      />
      
      <div className="input-section" style={{ marginTop: '10px' }}>
        <textarea
          className="input-box"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter simulation (re) input here..."
        />
      </div>
      
      {result && (
        <div className="result-section">
          <h3 style={{ margin: 0, marginBottom: '10px' }}>{oType ? oType : 'Output:'}</h3>
          <pre>{result}</pre>
        </div>
      )}
      
      <footer style={{
        padding: '10px',
        borderTop: '1px solid #ccc',
        textAlign: 'center',
        color: '#666'
      }}>
        <p style={{ margin: 0 }}>Online Ruby Compiler &copy; 2025 KevinZonda. All rights reserved.</p>
        <p style={{ margin: 0 }}>Imperial Ruby Compiler/Ruby DHL is a project that belongs to Imperial College London and its authors. Online Ruby Compiler (ORC) is an independent project created to facilitate working with Ruby DHL, and is not affiliated with Imperial College London.</p>
      </footer>
    </div>
  )
}

export default App
