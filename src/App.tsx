import ReactCodeMirror, { EditorView, keymap, EditorSelection } from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language';

import { api } from './api'
import './App.css'
import { useState } from 'react'
import { simpleMode } from '@codemirror/legacy-modes/mode/simple-mode';
import { Graphviz } from 'graphviz-react';

const defaultCode = 'INCLUDE "prelude.rby". \n\n# Your code here...\ncurrent = VAR x . x $rel (`add` <x,x>).'

function App() {
  const [code, setCode] = useState(localStorage.getItem('code') || defaultCode)
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  const [taskId, setTaskId] = useState(localStorage.getItem('taskId') || '')
  const [oType, setOType] = useState('')
  const [viz, setViz] = useState('');

  const handleClear = () => {
    updTaskId('');
    localStorage.removeItem('taskId');
    localStorage.removeItem('code');
    updCode(defaultCode);
    setInput('');
    setResult('');
    setOType('');
  }

  const initViz = () => {
    setViz('');
  }

  const updTaskId = (id : string) => {
    setTaskId(id);
    localStorage.setItem('taskId', id);
  }

  const updCode = (code : string) => {
    setCode(code);
    localStorage.setItem('code', code);
  }


  const toggleHashComment = (view : EditorView) => {
    const { state } = view;
    const selection = state.selection.main;
  
    // Identify the first and last lines covered by the selection (or cursor)
    const startLine = state.doc.lineAt(selection.from);
    const endLine = state.doc.lineAt(selection.to);
  
    // Gather each relevant line
    const lines = [];
    for (let l = startLine.number; l <= endLine.number; l++) {
      lines.push(state.doc.line(l));
    }
  
    // Check whether every line is already commented
    const allCommented = lines.every(line => line.text.trimStart().startsWith("#"));
  
    // Build the list of changes
    const changes = lines.map(line => {
      if (allCommented) {
        // Remove the first "#" character in the line
        const hashIndex = line.text.indexOf("#");
        return {
          from: line.from + hashIndex,
          to: line.from + hashIndex + 1,
          insert: ""
        };
      } else {
        // Add a "#" at the beginning of the line
        return {
          from: line.from,
          to: line.from,
          insert: "#"
        };
      }
    });
  
    // Apply the changes
    view.dispatch({ changes });
    return true;
  }

  const updRst = (rst : string) => {
    setResult(rst + '\nProduced at: ' + new Date().toLocaleString());
  }

  const handleCompile = async () => {
    initViz();
    const id = taskId ? taskId : undefined;
    const response = await api.compile(code, id);
    updTaskId(response.task_id);

    updRst(response.rbs);
    if (response.compile_err) {
      // alert(response.compile_err);
      setOType('Compile Error:');
      updRst(response.compile_err);
      return { success: false, response: response };
    }
    setOType('Compile Output:');
    return { success: true, response: response };
  }

  const handleViz = async () => {
    const compileResp = await handleCompile();
    if (!compileResp.success) return;
    const response = await api.viz(compileResp.response.task_id, input);
    setViz(response.output);
  }

  const handleRun = async () => {
    initViz();
    const compileResp = await handleCompile();
    if (!compileResp.success) return;
    const response = await api.run(compileResp.response.task_id, input);
    if (response.err) {
      setOType('Run Error:');
      updRst(response.err);
    }
    if (response.task_id && response.task_id != '') {
      updTaskId(response.task_id);
    }
    updRst(response.output);
    setOType('Run Output:');
  }

  return (
    <div className="code-editor-container" style={{ width: '100%', height: '100%' }}>
      <h1>Imperial Ruby Compiler</h1>
      
      <div className="nav-bar" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <div className="task-id">
          Task ID: {taskId ? taskId : 'N/A'}
        </div>
        <div className="button-group">
          <button className="btn-clear" onClick={handleClear}>🧹 Clear</button>
          <button className="btn-viz" onClick={handleViz}>🎨 Viz</button>
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
          keymap.of([{
            key: "Mod-/",
            run: (view) => toggleHashComment(view)
          }]),
          EditorView.theme({
            ".cm-scroller": {
              // overflow: "visible",
            },
          })
        ]}
        height="auto"
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

      {viz && (
        <div className="viz-section">
          <h3 style={{ margin: 0, marginBottom: '10px' }}>Visualization</h3>
          <Graphviz dot={viz} options={{ width: '100%', height: 500 }} />
        </div>
      )}
      
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
        <p style={{ margin: 0 }}>Imperial Ruby Compiler/Ruby HDL is a project that belongs to Imperial College London and its authors. Online Ruby Compiler (ORC) is an independent project created to facilitate working with Ruby HDL, and is not affiliated with Imperial College London.</p>
      </footer>
    </div>
  )
}

export default App
