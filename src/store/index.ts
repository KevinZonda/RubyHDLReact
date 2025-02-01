import { makeAutoObservable } from "mobx";

const defaultCode = 'INCLUDE "prelude.rby". \n\n# Your code here...\ncurrent = VAR x . x $rel (`add` <x,x>).'

export class _codeStore {
    public constructor() {
        makeAutoObservable(this);
    }


    // #region Code
    private _code = localStorage.getItem('code') || defaultCode;

    public resetCode() {
        this.code = defaultCode;
    }

    public get code() {
        return this._code;
    }

    public set code(code: string) {
        this._code = code;
        localStorage.setItem('code', code);
    }
    // #endregion


    // #region TaskId
    private _taskId = localStorage.getItem('taskId') || '';

    public get taskId() {
        return this._taskId;
    }

    public set taskId(taskId: string) {
        this._taskId = taskId;
        localStorage.setItem('taskId', taskId);
    }
    // #endregion


    // #region Viz
    private _viz = '';

    public get viz() {
        return this._viz;
    }
    
    public set viz(viz: string) {
        this._viz = viz;
    }

    public vizRotate() {
        if (!this.viz) return;
        if (this.viz.startsWith('digraph circuit {\n\trankdir=LR;\n')) {
            const newViz = this.viz.replace('digraph circuit {\n\trankdir=LR;\n', 'digraph circuit {\n');
            this.viz = newViz;
        } else {
            const newViz = this.viz.replace('digraph circuit {\n', 'digraph circuit {\n\trankdir=LR;\n');
            this.viz = newViz;
        }
    }
    // #endregion

    // #region Result
    private _result = '';

    public get result() {
        return this._result;
    }

    public set result(result: string) {
        this._result = result;
    }

    public setResultWithTimestamp(result: string) {
        this.result = result + '\nProduced at: ' + new Date().toLocaleString();
    }
    // #endregion

    // #region OType
    private _oType = '';

    public get oType() {
        return this._oType ? this._oType : 'Output:';
    }

    public set oType(oType: string) {
        this._oType = oType;
    }
    // #endregion

    // #region input
    private _input = '';

    public get input() {
        return this._input;
    }

    public set input(input: string) {
        this._input = input;
    }
    // #endregion

    public resetAll() {
        this.taskId = '';
        this.resetCode();
        this.viz = '';
        this.result = '';
        this.input = '';
        this.oType = '';
    }
}

export const CodeStore = new _codeStore();