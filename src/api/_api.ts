
interface CompileRequest {
    code: string;
    task_id?: string;
}

interface CompileResponse {
    task_id: string;
    compile_err: string;
    rbs: string;
}

interface RunRequest {
    task_id: string;
    input: string;
}

interface RunResponse {
    output: string;
    error: string;
}

export class _api {
    baseUrl: string;
    constructor(baseUrl: string = 'https://ruby-api.kevinzonda.com') {
        this.baseUrl = baseUrl;
    }

    async compile(code: string, taskId?: string) {
        const response = await fetch(`${this.baseUrl}/ruby/compile`, {
            method: 'POST',
            body: JSON.stringify({ 
                code: code,
                task_id: taskId,
            } as CompileRequest),
        });
        return await response.json() as CompileResponse;
    }

    async run(taskId: string, input: string) {
        const response = await fetch(`${this.baseUrl}/ruby/run`, {
            method: 'POST',
            body: JSON.stringify({
                task_id: taskId,
                input: input,
            } as RunRequest),
        });
        return await response.json() as RunResponse;
    }
}