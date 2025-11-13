import {
    AppstoreAddOutlined,
    BellOutlined,
    BugOutlined,
    CloudUploadOutlined,
    UnorderedListOutlined,
    LeftOutlined,
    LoadingOutlined,
    RightOutlined,
    SettingOutlined,
    WechatOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Select, Skeleton } from 'antd';
import classnames from 'classnames';
import * as FlexLayout from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import globalStore from '../../components/GlobalComponent/globalStore';
import { programmingLanguages } from '../../constants/languages';
import * as http from '../../lib/httpRequest';
import stompClientLib from '../../lib/stomp-client.lib';
import routesConfig from '../../routes/routesConfig';
import utils from '../../utils/utils';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';

const json = {
    global: { tabSetEnableClose: false },
    layout: {
        type: 'row',
        weight: 100,
        children: [
            {
                type: 'tabset',
                weight: 35,
                children: [
                    {
                        type: 'tab',
                        name: 'Mô tả',
                        component: 'desc',
                        icon: '/sources/icons/description-ico.svg'
                    }
                ]
            },
            {
                type: 'column',
                weight: 65,
                children: [
                    {
                        type: 'tabset',
                        weight: 50,
                        children: [
                            {
                                type: 'tab',
                                name: 'Code',
                                component: 'editor',
                                icon: '/sources/icons/code-ico.svg'
                            }
                        ]
                    },
                    {
                        type: 'tabset',
                        weight: 50,
                        children: [
                            {
                                type: 'tab',
                                name: 'TestResult',
                                component: 'testResult',
                                icon: '/sources/icons/test-result-ico.svg'
                            },
                            {
                                type: 'tab',
                                name: 'Testcase',
                                component: 'testcase',
                                icon: '/sources/icons/testcase-ico.svg'
                            }
                        ]
                    }
                ]
            }
        ]
    }
};

const Exercise = observer(() => {
    const { id, exerciseId, submissionId } = useParams();
    const navigate = useNavigate();
    // const location = useLocation();

    if (!id && !exerciseId && !submissionId) {
        globalStore.triggerNotification('error', 'Exercise does not exist!', '');
        navigate(`/${routesConfig.exercises}`);
        return <></>;
    }

    /**
     * For submitted only
     */

    const [submittedData, setSubmittedData]: any = useState(null);
    const [submittedId, setSubmittedId] = useState<string | null>(null);

    useEffect(() => {
        if (submissionId) {
            http.get(`/submissions/${submissionId}/result`).then((res) => {
                setSubmittedData(res);
            });
        }
    }, []);

    useEffect(() => {
        if (submittedData) {
            setResponse(submittedData);
            setEditorValue(submittedData.data.sourceCode);
        }
        // setEditorValue();
    }, [submittedData]);

    const [model] = useState(FlexLayout.Model.fromJson(json));
    const layoutRef = useRef<FlexLayout.Layout | null>(null);

    const [language, setLanguage] = useState<number>(45);
    const [theme] = useState<'light' | 'vs-dark'>('vs-dark');
    const [exercise, setExercise] = useState<any>(null);
    const [editorValue, setEditorValue]: any = useState('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [response, setResponse] = useState<any>(null);
    const [selectedCaseResult, setSelectedCaseResult] = useState<any>(1);
    const [solution, setSolution] = useState<string | null>(null);

    const getDefaultTemplate = (lang: string): string => {
        switch (lang) {
            case 'python':
                return '# Write your Python code here';
            case 'cpp':
                return '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    return 0;\n}';
            case 'java':
                return 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}';
            case 'javascript':
                return 'console.log("Hello, world!");';
            case 'typescript':
                return 'console.log("Hello from TypeScript!");';
            case 'c':
                return '#include <stdio.h>\nint main() {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    printf("%d\\n", a + b);\n    return 0;\n}';
            case 'csharp':
                return 'using System;\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, world!");\n    }\n}';
            case 'go':
                return 'package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, world!");\n}';
            case 'rust':
                return 'fn main() {\n    println!("Hello, world!");\n}';
            case 'kotlin':
                return 'fun main() {\n    println("Hello, world!")\n}';
            case 'php':
                return '<?php\necho "Hello, world!";';
            case 'swift':
                return 'print("Hello, world!")';
            default:
                return '// Start coding here';
        }
    };

    const selectedLang = programmingLanguages.find((lang) => lang.id === language);
    const editorLanguage = selectedLang?.editorValue || 'javascript';

    const testRun = () => {
        setSolution(null);
        setSubmittedId(null);
        setError('');
        setLoading(true);

        const payload = { exerciseId: id, languageCode: language, sourceCode: editorValue };
        http.post('/submissions/run', payload)
            .then((res) => {
                // Do something
                setResponse(res);
            })
            .catch((error) => {
                setError(error.response.data.message);
                // Do something
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const submit = () => {
        setSolution(null);
        setSubmittedId(null);
        setError('');
        setLoading(true);

        const payload = { exerciseId: id, languageCode: language, sourceCode: editorValue };
        http.post('/submissions', payload)
            .then((res) => {
                // Do something
                setResponse(res);
                setSubmittedId(res.data.id);
            })
            .catch((error) => {
                setError(error.response.data.message);
                // Do something
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const factory = (node: any) => {
        const component = node.getComponent();
        if (component === 'desc') {
            return (
                <div className="exercise-description">
                    <h2 className="header">{exercise?.title || 'Title'}</h2>
                    <div className="tags">
                        <div className="tag difficulty">
                            {utils.capitalizeFirstLetter(exercise?.difficulty) || 'Difficulty'}
                        </div>
                        <div className="topics">
                            {exercise?.topics.map((topic: any) => {
                                return (
                                    <div key={topic.id} className="tag topic">
                                        {topic.name}
                                    </div>
                                );
                            }) || 'Topics'}
                        </div>
                    </div>
                    <p className="description">{exercise?.description || 'Description'}</p>
                    <div className="test-cases">
                        {exercise?.testCases.map((testCase: any, index: any) => {
                            return testCase.isPublic ? (
                                <div key={`${testCase.id}-${index}`} className="test-case">
                                    <strong className="header">Example {index + 1}:</strong>
                                    <div className="io">
                                        <div className="input">
                                            <strong>Input:</strong> {testCase.input}
                                        </div>
                                        <div className="input">
                                            <strong>Output:</strong> {testCase.output}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={`${testCase.id}-${index}`}></div>
                            );
                        }) || 'Test Cases'}
                    </div>
                </div>
            );
        } else if (component === 'editor') {
            return (
                <div className="code">
                    <div className="actions">
                        <Select
                            value={language}
                            onChange={(val) => setLanguage(val)}
                            options={programmingLanguages}
                            style={{ width: 200 }}
                        />
                    </div>
                    <div className="code-container">
                        <Editor
                            height="100%"
                            theme={theme}
                            language={editorLanguage}
                            value={editorValue}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                automaticLayout: true,
                                readOnly: submittedData
                            }}
                            onChange={(value) => setEditorValue(value)}
                        />
                    </div>
                </div>
            );
        } else if (component === 'testResult') {
            return (
                <div className="testResult">
                    {loading && (
                        <>
                            <LoadingOutlined className="mb-px" style={{ color: '#555555', fontSize: 20 }} />
                            <Skeleton active />
                        </>
                    )}
                    {error && (
                        <div className="error">
                            <div className="error-header">Error</div>
                            <div className="error-content">{error}</div>
                        </div>
                    )}
                    {response && !loading && !response?.data?.verdict && (
                        <div className="response">
                            <div
                                className={classnames(
                                    'response-header',
                                    response?.data?.allPassed ? 'accepted' : 'wrong'
                                )}
                            >
                                <div className="header">{response?.data?.allPassed ? 'Accepted' : 'Wrong Answer'}</div>
                            </div>
                            <div className="response-content">
                                <div className="group-testcases">
                                    <div className="btns">
                                        {response?.data?.results?.map((item: any, index: any) => {
                                            return (
                                                <div
                                                    className={classnames('btn', {
                                                        selected: index + 1 == selectedCaseResult
                                                    })}
                                                    onClick={() => setSelectedCaseResult(index + 1)}
                                                >
                                                    <img
                                                        src={
                                                            item.passed
                                                                ? '/sources/icons/green-check.svg'
                                                                : '/sources/icons/red-xmark.svg'
                                                        }
                                                    />
                                                    {`Case ${index + 1}`}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="testcase">
                                        {response?.data?.results?.map((item: any, index: any) => {
                                            return (
                                                <div
                                                    className={classnames('io', {
                                                        hide: index + 1 != selectedCaseResult
                                                    })}
                                                >
                                                    <div className="input wrapper">
                                                        <div className="label">Input</div>
                                                        <div className="content">{item.input}</div>
                                                    </div>
                                                    <div className="expected-output wrapper">
                                                        <div className="label">Expected Output</div>
                                                        <div className="content">{item.expectedOutput}</div>
                                                    </div>
                                                    <div
                                                        className={classnames('actual-output wrapper', {
                                                            match: item.passed
                                                        })}
                                                    >
                                                        <div className="label">Actual Output</div>
                                                        <div className="content">{item.actualOutput}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {response && !loading && response?.data?.verdict && (
                        <div className="response">
                            <div
                                className={classnames(
                                    'response-header',
                                    response?.data?.verdict == 'PROCESSING' || response?.data?.verdict == 'ACCEPTED'
                                        ? 'accepted'
                                        : 'wrong'
                                )}
                            >
                                <div className="header">{utils.capitalizeFirstLetter(response?.data?.verdict)}</div>
                            </div>
                            <div className="solution">
                                <div className="header">Gợi ý lời giải</div>
                                <div className="content">{solution}</div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    useEffect(() => {
        document.body.classList.add('independence-page');

        const handleResize = () => {
            layoutRef.current?.forceUpdate();
        };

        window.addEventListener('resize', handleResize);

        // Get exercise
        http.get(`exercises/${id || exerciseId}`).then((res) => {
            setExercise(res.data);
        });

        return () => {
            document.body.classList.remove('independence-page');
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        const newEditorValue = getDefaultTemplate(editorLanguage);

        setEditorValue(newEditorValue);
    }, [language]);

    useEffect(() => {
        let subscription: any = null;

        if (submittedId) {
            subscription = stompClientLib.subscribe({
                destination: `/topic/submission-result-updates/${submittedId}`,
                onMessage: ({ body }) => {
                    const result = JSON.parse(body);

                    setResponse({ data: result });
                }
            });
        }

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [submittedId]);

    useEffect(() => {
        if (response?.data?.exercise?.solution) setSolution(response?.data?.exercise?.solution);
    }, [response?.data?.exercise?.solution]);

    return (
        <div className="exercise">
            <div className="container">
                <div className="header">
                    <div className="left">
                        <div className="group-btn">
                            <TooltipWrapper tooltipText="Trở lại" position="right">
                                <LeftOutlined className="icon" onClick={() => navigate('/exercises')} />
                            </TooltipWrapper>
                            <TooltipWrapper tooltipText="Danh sách bài tập đã nộp" position="right">
                                <UnorderedListOutlined
                                    className="icon color-gold"
                                    onClick={() => navigate('/submissions')}
                                />
                            </TooltipWrapper>
                            {/* <RightOutlined className="icon" /> */}
                        </div>
                    </div>
                    <div className="center">
                        <div className={classnames('group-btn', { disabled: loading })}>
                            <BugOutlined className="icon" style={{ color: '#FFA118' }} />
                            {loading ? (
                                <div className="icon">
                                    <LoadingOutlined />
                                </div>
                            ) : (
                                <div className="icon" onClick={testRun}>
                                    <img src="/sources/icons/play-ico.svg" alt="" />
                                </div>
                            )}
                            <div className="icon submit-btn" onClick={submit}>
                                {loading ? (
                                    <LoadingOutlined style={{ fontSize: 18 }} />
                                ) : (
                                    <CloudUploadOutlined style={{ fontSize: 18 }} />
                                )}
                                Nộp bài
                            </div>
                        </div>
                    </div>
                    <div className="right">
                        <div className="group-btn">
                            <SettingOutlined className="icon" />
                            <BellOutlined className="icon" />
                            <WechatOutlined className="icon" />
                            <AppstoreAddOutlined className="icon" />
                        </div>
                    </div>
                </div>
                <div className="flex-layout">
                    <FlexLayout.Layout ref={layoutRef} model={model} factory={factory} />
                </div>
            </div>
        </div>
    );
});

export default Exercise;
