import ReactCodeMirror, { keymap } from '@uiw/react-codemirror'
import { StreamLanguage } from '@codemirror/language';
import { FaGithub } from 'react-icons/fa';

import { api } from './api'
import './App.css'
import { useEffect, useState } from 'react'
import { simpleMode } from '@codemirror/legacy-modes/mode/simple-mode';
import { Graphviz } from 'graphviz-react';
import { observer } from 'mobx-react-lite';
import { CodeStore } from './store';
import { downloadHrefAsFile, downloadTextAsFile, handleHashComment, RubyGrammarHighlight } from './grammar';
import { RunnableButton } from './components/button';
import { DarkModeIndicator } from './components/darkmode';

export const App = observer(() => {
  const [isDarkMode, setIsDarkMode] = useState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [displayVisDownload, setDisplayVisDownload] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        downloadTextAsFile(CodeStore.code, "current.rby");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark-theme');
  };

  const handleCompile = async (notDisplayLoading: boolean = false) => {
    CodeStore.viz = '';
    const id = CodeStore.taskId ? CodeStore.taskId : undefined;
    const response = await api.compile(CodeStore.code, id);
    CodeStore.taskId = response.task_id;
    if (response.compile_err) {
      // alert(response.compile_err);
      CodeStore.oType = 'Compile Error:';
      CodeStore.setResultWithTimestamp(response.compile_err);
      return { success: false, response: response };
    }

    if (!notDisplayLoading) {
      CodeStore.setResultWithTimestamp(response.rbs);
      CodeStore.oType = 'Compile Output:';
    }
    return { success: true, response: response };
  }

  const handleViz = async () => {
    const compileResp = await handleCompile();
    if (!compileResp.success) return;
    const response = await api.viz(compileResp.response.task_id, CodeStore.input);
    CodeStore.viz = response.output;
  }

  const handleRun = async () => {
    CodeStore.viz = '';

    const compileResp = await handleCompile(true);
    if (!compileResp.success) return;
    const response = await api.run(compileResp.response.task_id, CodeStore.input);
    if (response.task_id && response.task_id != '') {
      CodeStore.taskId = response.task_id;
    }

    if (response.err) {
      CodeStore.oType = 'Run Error:';
      CodeStore.setResultWithTimestamp(response.err);
      return;
    }

    CodeStore.setResultWithTimestamp(response.output);
    CodeStore.oType = 'Run Output:';
  }

  const getVizSVG = () => {
    const svgElement = document.querySelector('.viz-container svg');
    if (!svgElement) return undefined;
    return new XMLSerializer().serializeToString(svgElement);
  }

  const handleDownloadVizSVG = () => {
    const svgData = getVizSVG();
    if (!svgData) return;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    downloadHrefAsFile(url, 'visualization.svg');
    URL.revokeObjectURL(url);
  }

  const handleNewVizSVGPage = () => {
    const svgData = getVizSVG();
    if (!svgData) return;
    const newWindow = window.open('', '_blank');
    if (!newWindow) return;
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    if (svgElement) {
      svgElement.setAttribute('height', '100%');
    }
    newWindow.document.body.innerHTML = svgElement?.outerHTML || svgData;
    newWindow.document.title = 'Circuit Visualization';
  }

  return (
    <div className="code-editor-container" style={{ width: '100%', height: '100%' }}>
      <h1 style={{ marginBottom: 0 }}>
        Imperial Ruby Compiler
        <DarkModeIndicator toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      </h1>
      <div className="nav-bar" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <div className="button-group">

          <RunnableButton className="btn-clear" onClick={() => CodeStore.resetAll()} text={'🧹 Clear'} />
          <RunnableButton className="btn-viz" onClick={handleViz} text={'🎨 Viz'} />
          <RunnableButton className="btn-build" onClick={() => handleCompile()} text={'🛠️ Compile'} />
          <RunnableButton className="btn-play" onClick={handleRun} text="▶ Run" />
          {/* <button className="btn-download" onClick={handleDownloadCode}>📄 Download</button> */}
        </div>
      </div>

      <ReactCodeMirror
        value={CodeStore.code}
        onChange={(value) => CodeStore.code = value}
        placeholder="Enter your code here..."
        theme={isDarkMode ? 'dark' : 'light'}
        extensions={[
          StreamLanguage.define(simpleMode(RubyGrammarHighlight)),
          keymap.of([{
            key: "Mod-/",
            run: (view) => handleHashComment(view)
          }])
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
          value={CodeStore.input}
          onChange={(e) => CodeStore.input = e.target.value}
          placeholder="Enter simulation (re) input here..."
        />
      </div>

      {CodeStore.viz && (
        <div className="viz-section" style={{ padding: isDarkMode ? '15px' : '0px' }}>
          <div className="viz-container" onMouseOver={() => setDisplayVisDownload(true)} onMouseLeave={() => setDisplayVisDownload(false)}>
            <h3 style={{ margin: 0, marginBottom: '10px' }}>Visualisation</h3>
            <div onClick={handleNewVizSVGPage} style={{ cursor: 'pointer' }}>
              <Graphviz dot={CodeStore.viz} options={{ width: '100%', height: 500 }} />
            </div>
            <div className="button-group download-viz" style={{ display: displayVisDownload ? 'flex' : 'none' }}>
              <button onClick={handleNewVizSVGPage}>🔍 Zoom</button>
              <button onClick={() => CodeStore.vizRotate()}>🔄 Rotate</button>
              <button onClick={handleDownloadVizSVG}>💾 SVG</button>
              <button onClick={() => downloadTextAsFile(CodeStore.viz, "visualization.dot")}>📄 DOT</button>
            </div>
          </div>
        </div>
      )}

      {CodeStore.result && (
        <div className="result-section">
          <h3 style={{ margin: 0, marginBottom: '10px' }}>{CodeStore.oType}</h3>
          <pre>{CodeStore.result}</pre>
        </div>
      )}

      <footer style={{
        padding: '10px',
        borderTop: '1px solid #ccc',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0 }}>
          <a href="https://github.com/KevinZonda/RubyHDLReact"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              color: 'inherit',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textUnderlineOffset: '4px',
              transition: 'text-decoration-style 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.textDecorationStyle = 'solid'}
            onMouseOut={(e) => e.currentTarget.style.textDecorationStyle = 'dotted'}
          >
            <FaGithub /> View on GitHub KevinZonda/RubyHDLReact
          </a>
        </p>
        <p style={{ margin: 0 }}>Task UUID (Debug Only): {CodeStore.taskId ? CodeStore.taskId : 'N/A'}</p>
        <p style={{ margin: 0 }}>Online Ruby Compiler &copy; 2025 KevinZonda. All rights reserved.</p>
        <p style={{ margin: 0 }}>Imperial Ruby Compiler/Ruby HDL is a project that belongs to Imperial College London and its authors. Online Ruby Compiler (ORC) is an independent project created to facilitate working with Ruby HDL, and is not affiliated with Imperial College London.</p>
      </footer>
    </div>
  )
})