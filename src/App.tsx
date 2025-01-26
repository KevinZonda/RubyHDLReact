import ReactCodeMirror, { EditorView, keymap } from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language';
import { MdOutlineNightlight, MdOutlineWbSunny } from 'react-icons/md';

import { api } from './api'
import './App.css'
import { useEffect, useState } from 'react'
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
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isVizing, setIsVizing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [displayVisDownload, setDisplayVisDownload] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

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

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    // localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark-theme');
  };

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

  const handleCompile = async (needloading: boolean = true) => {
    if (needloading) {
      setIsCompiling(true);
    }
    initViz();
    const id = taskId ? taskId : undefined;
    const response = await api.compile(code, id);
    updTaskId(response.task_id);
    updRst(response.rbs);
    if (response.compile_err) {
      // alert(response.compile_err);
      setOType('Compile Error:');
      updRst(response.compile_err);
      if (needloading) {
        setIsCompiling(false);
      }
      return { success: false, response: response };
    }
    setOType('Compile Output:');
    if (needloading) {
      setIsCompiling(false);
    }
    return { success: true, response: response };
  }

  const handleViz = async () => {
    setIsVizing(true);
    const compileResp = await handleCompile(false);
    if (!compileResp.success) return;
    const response = await api.viz(compileResp.response.task_id, input);
    setViz(response.output);
    setIsVizing(false);
  }

  const handleRun = async () => {
    setIsRunning(true);
    initViz();
    const compileResp = await handleCompile(false);
    if (!compileResp.success) {
      setIsRunning(false);
      return;
    }
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
    setIsRunning(false);
  }

  const handleDownloadVizSVG = () => {
    const svgElement = document.querySelector('.viz-container svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'visualization.svg';
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  const handleDownloadVizDot = () => {
    const element = document.createElement("a");
    element.href = `data:text/plain;charset=utf-8,${encodeURIComponent(viz)}`;
    element.download = "visualization.dot";
    element.click();
  }

  const handleDownloadCode = () => {
    const element = document.createElement("a");
    element.href = `data:text/plain;charset=utf-8,${encodeURIComponent(code)}`;
    element.download = "current.rby";
    element.click();
  }

  return (
    <div className="code-editor-container" style={{ width: '100%', height: '100%' }}>
      <h1>
        Imperial Ruby Compiler
        {
          isDarkMode ? <MdOutlineWbSunny onClick={toggleTheme} style={{ fontSize: '0.6em', marginLeft: '5px', cursor: 'pointer', verticalAlign: 'top' }} />
                      : <MdOutlineNightlight onClick={toggleTheme} style={{ fontSize: '0.6em', marginLeft: '5px', cursor: 'pointer', verticalAlign: 'top' }} />
        }
      </h1>
      
      <div className="nav-bar" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <div className="task-id">
          Task ID: {taskId ? taskId : 'N/A'}
        </div>
        <div className="divider"></div>
        <div className="button-group">
          <button className="btn-clear" onClick={handleClear}>🧹 Clear</button>
          <button className="btn-viz" onClick={handleViz}>{isVizing ? '🎨 Viz...' : '🎨 Viz'}</button>
          <button className="btn-build" onClick={() => handleCompile(true)}>{isCompiling ? '🛠️ Compiling...' : '🛠️ Compile'}</button>
          <button className="btn-play" onClick={handleRun}>{isRunning ? '▶ Running...' : '▶ Run'}</button>
          <button className="btn-download" onClick={handleDownloadCode}>📄 Download</button>
        </div>
      </div>
      
      <ReactCodeMirror
        value={code}
        onChange={(value) => updCode(value)}
        placeholder="Enter your code here..."
        theme={isDarkMode ? 'dark' : 'light'}
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
          <div className="viz-container" onMouseOver={() => setDisplayVisDownload(true)} onMouseLeave={() => setDisplayVisDownload(false)}>
            <h3 style={{ margin: 0, marginBottom: '10px' }}>Visualization</h3>
            <Graphviz dot={viz} options={{ width: '100%', height: 500 }} />
            <div className="button-group download-viz" style={{ display: displayVisDownload ? 'flex' : 'none' }}>
              <button className="btn-viz-download-svg" onClick={handleDownloadVizSVG}>💾 SVG</button>
              <button className="btn-viz-download-dot" onClick={handleDownloadVizDot}>📄 DOT</button>
            </div>
          </div>
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
        textAlign: 'center'
      }}>
        <p style={{ margin: 0 }}>Online Ruby Compiler &copy; 2025 KevinZonda. All rights reserved.</p>
        <p style={{ margin: 0 }}>Imperial Ruby Compiler/Ruby HDL is a project that belongs to Imperial College London and its authors. Online Ruby Compiler (ORC) is an independent project created to facilitate working with Ruby HDL, and is not affiliated with Imperial College London.</p>
      </footer>
    </div>
  )
}

export default App
