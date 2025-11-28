import {
    AppstoreAddOutlined,
    BellOutlined,
    BugOutlined,
    CloudUploadOutlined,
    LeftOutlined,
    LoadingOutlined,
    SettingOutlined,
    UnorderedListOutlined,
    WechatOutlined,
    PlayCircleOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { Select, Skeleton } from 'antd';
import classnames from 'classnames';
import * as FlexLayout from 'flexlayout-react';
import 'flexlayout-react/style/light.css';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Shepherd from 'shepherd.js';
import type { StepOptions } from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';
import globalStore from '../../components/GlobalComponent/globalStore';
import TooltipWrapper from '../../components/TooltipWrapper/TooltipWrapperComponent';
import { programmingLanguages } from '../../constants/languages';
import * as http from '../../lib/httpRequest';
import stompClientLib from '../../lib/stomp-client.lib';
import routesConfig from '../../routes/routesConfig';
import authentication from '../../shared/auth/authentication';
import utils from '../../utils/utils';
import Submissions from './components/Submissions';
import AIAssistant from './components/AIAssistant';
import Comments from './components/Comments';

const json = {
    global: { tabSetEnableClose: false },
    layout: {
        type: 'row',
        weight: 100,
        children: [
            {
                type: 'tabset',
                weight: 40,
                children: [
                    {
                        type: 'tab',
                        name: 'Mô tả',
                        component: 'desc',
                        icon: '/sources/icons/description-ico.svg'
                    },
                    {
                        type: 'tab',
                        name: 'Danh sách bài tập đã nộp',
                        component: 'submissions',
                        icon: '/sources/icons/list-ico.svg'
                    },
                    {
                        type: 'tab',
                        name: 'Comment',
                        component: 'comments',
                        icon: '/sources/icons/list-ico.svg'
                    },
                    {
                        type: 'tab',
                        name: 'AI Assistant',
                        component: 'ai-assistant',
                        icon: '/sources/icons/ai-assistant-ico.svg'
                    }
                ]
            },
            {
                type: 'column',
                weight: 60,
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
    /**
     * @param submissionId lấy kết 1 kết quả nộp của 1 exercise Id
     */
    const { id, exerciseId, submissionId } = useParams();
    const navigate = useNavigate();

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
    const tourRef = useRef<InstanceType<typeof Shepherd.Tour> | null>(null);

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
                <div className="exercise-description" data-tourid="exercise-description">
                    <h2 className="header">{exercise?.title || 'Title'}</h2>
                    <div className="tags">
                        <div className="tag difficulty pointer hover-scale">
                            {utils.capitalizeFirstLetter(exercise?.difficulty) || 'Difficulty'}
                        </div>
                        <div className="topics flex gap">
                            {exercise?.topics.map((topic: any, index: any) => {
                                const temp = exercise?.topics.map((t: any) => t.name);

                                if (index == 3)
                                    return (
                                        <div key={topic.id} className="tag topic pointer hover-scale">
                                            <TooltipWrapper tooltipText={temp.slice(3).join(', ')} position="top">
                                                ...
                                            </TooltipWrapper>
                                        </div>
                                    );

                                return index > 2 ? (
                                    <></>
                                ) : (
                                    <div key={topic.id} className="tag topic pointer hover-scale">
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
                <div className="code" data-tourid="code-editor">
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
                <div className="testResult" data-tourid="test-result-tab">
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
                                                    key={`test-case-result-item-${index}`}
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
                                <div className="header">
                                    {response?.data?.verdict == 'PROCESSING' && <LoadingOutlined className="mr-8" />}
                                    {utils.capitalizeFirstLetter(response?.data?.verdict)}
                                </div>
                            </div>
                            <div className="solution">
                                <div className="header">Gợi ý lời giải</div>
                                <div
                                    className="content"
                                    style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}
                                    dangerouslySetInnerHTML={{
                                        __html: (solution || '').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            );
        } else if (component == 'testcase') {
            return (
                <div className="testResult">
                    {response && !loading && submittedData && (
                        <div className="response">
                            <div className="response-content">
                                <div className="group-testcases">
                                    <div className="btns">
                                        {submittedData.data.submissionResults.map((item: any, index: any) => {
                                            return (
                                                <div
                                                    key={`test-case-result-item-${index}`}
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
                                        {submittedData.data.submissionResults.map((item: any, index: any) => {
                                            console.log('log:', item);
                                            return (
                                                <div
                                                    className={classnames('io', {
                                                        hide: index + 1 != selectedCaseResult
                                                    })}
                                                >
                                                    <div className="input wrapper">
                                                        <div className="label">Input</div>
                                                        <div className="content">{item.testCase?.input}</div>
                                                    </div>
                                                    <div className="expected-output wrapper">
                                                        <div className="label">Expected Output</div>
                                                        <div className="content">{item.testCase?.output}</div>
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
                </div>
            );
        } else if (component === 'submissions') {
            return (
                <div data-tourid="submissions-tab">
                    <Submissions id={id || exerciseId} submissionId={submissionId} />
                </div>
            );
        } else if (component === 'comments') {
            return <Comments exerciseId={id || exerciseId} />;
        } else if (component === 'ai-assistant') {
            return <AIAssistant />;
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

                    console.log('log:', result);

                    setResponse({ data: { results: result } });
                }
            });
        }

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [submittedId]);

    useEffect(() => {
        if (submissionId) {
            setLoading(true);
            http.get(`/submissions/${submissionId}/result`)
                .then((res) => {
                    setSubmittedData(res);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setSubmittedData(null);
            setEditorValue('');
            setResponse(null);
        }
        return () => {};
    }, [submissionId]);

    useEffect(() => {
        if (response?.data?.exercise?.solution) setSolution(response?.data?.exercise?.solution);
    }, [response?.data?.exercise?.solution]);

    // Create tour guide
    const createTour = useCallback(() => {
        const steps: StepOptions[] = [
            {
                id: 'exercise-description',
                text: 'Đây là phần mô tả bài tập. Bạn có thể xem đề bài, độ khó và các ví dụ test case ở đây. Bạn có thể chuyển sang các tab khác như "Danh sách bài tập đã nộp" và "AI Assistant" ở phía trên.',
                attachTo: {
                    element: '[data-tourid="exercise-description"]',
                    on: 'right' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            localStorage.setItem('exercise-tour-completed', 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'code-editor',
                text: 'Đây là trình soạn thảo code. Bạn có thể chọn ngôn ngữ lập trình ở trên và viết code giải bài tập ở đây.',
                attachTo: {
                    element: '[data-tourid="code-editor"]',
                    on: 'left' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            localStorage.setItem('exercise-tour-completed', 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'test-run-btn',
                text: 'Nút "Test Run" (biểu tượng play) cho phép bạn chạy thử code với các test case mà không nộp bài. Kết quả sẽ hiển thị ở tab TestResult bên dưới.',
                attachTo: {
                    element: '[data-tourid="test-run-btn"]',
                    on: 'bottom' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            localStorage.setItem('exercise-tour-completed', 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'submit-btn',
                text: 'Nút "Nộp bài" để nộp bài làm của bạn. Sau khi nộp, hệ thống sẽ chấm điểm và hiển thị kết quả ở tab TestResult.',
                attachTo: {
                    element: '[data-tourid="submit-btn"]',
                    on: 'bottom' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            localStorage.setItem('exercise-tour-completed', 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Tiếp theo',
                        action: () => tourRef.current?.next()
                    }
                ]
            },
            {
                id: 'test-result-tab',
                text: 'Tab TestResult hiển thị kết quả sau khi bạn chạy test hoặc nộp bài. Bạn có thể xem từng test case đã pass hay fail và so sánh output của bạn với output mong đợi.',
                attachTo: {
                    element: '[data-tourid="test-result-tab"]',
                    on: 'top' as const
                },
                buttons: [
                    {
                        text: 'Bỏ qua',
                        action: () => {
                            localStorage.setItem('exercise-tour-completed', 'true');
                            tourRef.current?.cancel();
                        },
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Quay lại',
                        action: () => tourRef.current?.back(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Hoàn thành',
                        action: () => {
                            localStorage.setItem('exercise-tour-completed', 'true');
                            tourRef.current?.complete();
                        }
                    }
                ]
            }
        ];

        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                cancelIcon: {
                    enabled: false
                },
                scrollTo: { behavior: 'smooth', block: 'center' }
            }
        });

        steps.forEach((step) => {
            tour.addStep(step);
        });

        tour.on('complete', () => {
            localStorage.setItem('exercise-tour-completed', 'true');
        });

        tour.on('cancel', () => {
            localStorage.setItem('exercise-tour-completed', 'true');
        });

        return tour;
    }, []);

    // Check if tour should run (only for STUDENT and first time)
    useEffect(() => {
        if (authentication.isStudent && exercise) {
            const tourKey = 'exercise-tour-completed';
            const hasCompletedTour = localStorage.getItem(tourKey);

            if (!hasCompletedTour) {
                // Delay to ensure DOM and FlexLayout are ready
                setTimeout(() => {
                    // Double check that elements exist before starting tour
                    const descriptionEl = document.querySelector('[data-tourid="exercise-description"]');
                    const editorEl = document.querySelector('[data-tourid="code-editor"]');

                    if (descriptionEl && editorEl) {
                        if (!tourRef.current) {
                            tourRef.current = createTour();
                            tourRef.current.start();
                        }
                    }
                }, 1000);
            }
        }

        return () => {
            if (tourRef.current) {
                tourRef.current.cancel();
                tourRef.current = null;
            }
        };
    }, [exercise, createTour]);

    return (
        <div className="exercise">
            <div className="container">
                <div className="header">
                    <div className="left">
                        <div className="group-btn">
                            <TooltipWrapper tooltipText="Trở lại" position="right">
                                <LeftOutlined
                                    className="icon"
                                    onClick={() => {
                                        navigate(-1);
                                    }}
                                />
                            </TooltipWrapper>
                            {submissionId && (
                                <TooltipWrapper tooltipText="Tiếp tục bài làm" position="right">
                                    <PlayCircleOutlined
                                        className="icon color-cyan"
                                        onClick={() => {
                                            if (exerciseId) {
                                                navigate(`/${routesConfig.exercise}`.replace(':id?', exerciseId));
                                            }
                                        }}
                                    />
                                </TooltipWrapper>
                            )}
                            <TooltipWrapper tooltipText="Danh sách bài tập" position="right">
                                <UnorderedListOutlined
                                    className="icon color-gold"
                                    onClick={() => navigate('/exercises')}
                                />
                            </TooltipWrapper>
                            {/* <RightOutlined className="icon" /> */}
                        </div>
                    </div>
                    <div className={classnames('center', { disabled: submittedData })}>
                        <div className={classnames('group-btn', { disabled: loading })}>
                            <BugOutlined className="icon" style={{ color: '#FFA118' }} />
                            {loading ? (
                                <div className="icon">
                                    <LoadingOutlined />
                                </div>
                            ) : (
                                <div className="icon" onClick={testRun} data-tourid="test-run-btn">
                                    <img src="/sources/icons/play-ico.svg" alt="" />
                                </div>
                            )}
                            <div className="icon submit-btn" onClick={submit} data-tourid="submit-btn">
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
