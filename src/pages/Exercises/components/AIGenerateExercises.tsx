import { Button, Form, Spin, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import globalStore from '../../../components/GlobalComponent/globalStore';
import * as http from '../../../lib/httpRequest';
import ExerciseForm from './ExerciseForm';
import ExercisePreviewCard from './ExercisePreviewCard';
import type { ExercisePreview } from './ExercisePreviewCard';
import routesConfig from '../../../routes/routesConfig';

type GeneratedTestCase = ExercisePreview['testCases'][number] & { id?: string | null };

interface GenerateExercisePayload {
    topic: string;
    level: string[];
    numberOfExercise: number;
    numberOfPublicTestCases: number;
    numberOfPrivateTestCases: number;
    totalTestCasesPerExercise: number;
    solutionLanguage: string;
    visibility: string;
    prompt?: string;
}

interface GenerateExercisesResponse {
    exercises?: Array<Omit<ExercisePreview, 'testCases'> & { testCases: GeneratedTestCase[] }>;
}

const JUDGE0_BASE_URL = import.meta.env.VITE_JUDGE0_BASE_URL || 'http://74.226.208.247:2358';

const LANGUAGE_ID_MAP: Record<string, number> = {
    Java: 62,
    'JavaScript': 63,
    TypeScript: 74,
    Python: 71,
    'C++': 54,
    C: 50,
    Kotlin: 78,
    'C#': 51
};

interface JudgeSubmission {
    token: string;
    status?: {
        id: number;
        description: string;
    };
    stdout: string | null;
    stderr: string | null;
    time?: string | null;
}

interface RunResult extends JudgeSubmission {
    index: number;
    input: string;
    expected: string;
    isPassed: boolean;
}

const AIGenerateExercises = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [aiLoading, setAILoading] = useState(false);
    const [aiPreviewExercises, setAIPreviewExercises] = useState<ExercisePreview[]>([]);
    const [aiStep, setAIStep] = useState(0); // 0: nhập thông tin, 1: preview
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [topics, setTopics] = useState<Array<{ value: string; label: string }>>([]);
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [numberOfExercise, setNumberOfExercise] = useState<number>(2);
    const [numberOfPublicTestCases, setNumberOfPublicTestCases] = useState<number>(2);
    const [numberOfPrivateTestCases, setNumberOfPrivateTestCases] = useState<number>(2);
    const [solutionLanguage, setSolutionLanguage] = useState<string>('Java');
    const [prompt, setPrompt] = useState<string>('');
    const [visibility, setVisibility] = useState<string>('DRAFT');
    const [, setDeletedExercises] = useState<Array<{ exercise: ExercisePreview; index: number }>>([]);
    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const pageTitle = useMemo(() => (aiStep === 0 ? 'Nhập thông tin tạo bài tập' : 'Xem trước & chỉnh sửa'), [aiStep]);
    const [runLoading, setRunLoading] = useState(false);
    const [hasRun, setHasRun] = useState(false);
    const [runResults, setRunResults] = useState<RunResult[]>([]);
    const [runError, setRunError] = useState('');
    const [singleCreateLoading, setSingleCreateLoading] = useState(false);

    const handleAIGenerate = async () => {
        try {
            await form.validateFields();
        } catch {
            return;
        }

        setAILoading(true);
        try {
            const values = form.getFieldsValue() as Partial<GenerateExercisePayload> & { prompt?: string };
            const publicTestCases = values.numberOfPublicTestCases || numberOfPublicTestCases;
            const privateTestCases = values.numberOfPrivateTestCases || numberOfPrivateTestCases;
            const payload: GenerateExercisePayload = {
                topic: values.topic || selectedTopic,
                level: values.level || selectedLevels,
                numberOfExercise: values.numberOfExercise || numberOfExercise,
                numberOfPublicTestCases: publicTestCases,
                numberOfPrivateTestCases: privateTestCases,
                totalTestCasesPerExercise: publicTestCases + privateTestCases,
                solutionLanguage: values.solutionLanguage || solutionLanguage,
                visibility: values.visibility || visibility
            };
            
            // Chỉ thêm prompt nếu có giá trị
            const promptValue = values.prompt || prompt;
            if (promptValue && promptValue.trim()) {
                payload.prompt = promptValue.trim();
            }
            const res = (await http.post('/ai/exercises/generate', payload)) as GenerateExercisesResponse;

            if (res.exercises && res.exercises.length > 0) {
                const exercisesWithoutId: ExercisePreview[] = res.exercises.map((exerciseData) => ({
                    ...exerciseData,
                    testCases: exerciseData.testCases.map((tc) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { id, ...rest } = tc;
                        return rest;
                    })
                }));

                setAIPreviewExercises(exercisesWithoutId);
                setAIStep(1); // Chuyển sang step preview
            } else {
                globalStore.triggerNotification('error', 'Không có bài tập nào được tạo!', '');
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            globalStore.triggerNotification('error', err.response?.data?.message || 'Có lỗi xảy ra!', '');
        } finally {
            setAILoading(false);
        }
    };

    const buildExercisePayload = (exercise: ExercisePreview) => ({
        code: exercise.code,
        title: exercise.title,
        description: exercise.description,
        maxSubmissions: 0,
        topicIds:
            exercise.topicIds && exercise.topicIds.length > 0 ? exercise.topicIds : selectedTopic ? [selectedTopic] : [],
        visibility: exercise.visibility || visibility,
        timeLimit: exercise.timeLimit,
        memory: exercise.memory,
        difficulty: exercise.difficulty,
        solution: exercise.solution || '',
        solutionLanguage: exercise.solutionLanguage || solutionLanguage,
        prompt: exercise.prompt,
        testCases: exercise.testCases || []
    });

    const handleAICreateExercises = async () => {
        if (aiPreviewExercises.length === 0) return;

        setAILoading(true);
        try {
            let successCount = 0;
            for (const exerciseData of aiPreviewExercises) {
                await http.post('/exercises', buildExercisePayload(exerciseData));
                successCount++;
            }

            globalStore.triggerNotification('success', `Đã tạo ${successCount} bài tập thành công!`, '');
            handleBackToExercises();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            globalStore.triggerNotification('error', err.response?.data?.message || 'Có lỗi xảy ra!', '');
        } finally {
            setAILoading(false);
        }
    };

    const handleCreateSingleExercise = async () => {
        const exercise = aiPreviewExercises[activeExerciseIndex];
        if (!exercise) {
            message.warning('Vui lòng chọn bài tập để tạo');
            return;
        }

        setSingleCreateLoading(true);
        try {
            await http.post('/exercises', buildExercisePayload(exercise));
            message.success(`Đã tạo bài tập "${exercise.title}" thành công!`);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            globalStore.triggerNotification('error', err.response?.data?.message || 'Có lỗi xảy ra khi tạo bài tập!', '');
        } finally {
            setSingleCreateLoading(false);
        }
    };

    const resetState = () => {
        setAIPreviewExercises([]);
        setAIStep(0);
        setEditingIndex(null);
        setSelectedTopic('');
        setSelectedLevels([]);
        setNumberOfExercise(2);
        setNumberOfPublicTestCases(2);
        setNumberOfPrivateTestCases(2);
        setSolutionLanguage('Java');
        setPrompt('');
        setVisibility('DRAFT');
        setDeletedExercises([]);
        setRunLoading(false);
        setHasRun(false);
        setRunResults([]);
        setRunError('');
        setSingleCreateLoading(false);
        setActiveExerciseIndex(0);
        form.resetFields();
    };

    const handleBackToExercises = () => {
        resetState();
        navigate(`/${routesConfig.exercises}`);
    };

    useEffect(() => {
            setTopicsLoading(true);
            http.get('/topics?pageSize=100')
            .then((res: { data?: Array<{ id: string; name: string }> }) => {
                const topicsList = (res.data || []).map((topic) => ({
                        value: topic.id,
                        label: topic.name
                    }));
                    setTopics(topicsList);
                })
                .catch((error) => {
                    console.error('Error fetching topics:', error);
                    globalStore.triggerNotification('error', 'Không thể tải danh sách topics!', '');
                })
                .finally(() => {
                    setTopicsLoading(false);
                });
    }, []);

    const handleDeleteExercise = (index: number) => {
        const exercise = aiPreviewExercises[index];
        const newExercises = aiPreviewExercises.filter((_, i) => i !== index);
        setAIPreviewExercises(newExercises);
        
        // Lưu bài tập đã xóa để có thể undo
        setDeletedExercises((prev) => [...prev, { exercise, index }]);
        
        if (editingIndex === index) {
            setEditingIndex(null);
        } else if (editingIndex !== null && editingIndex > index) {
            setEditingIndex(editingIndex - 1);
        }

        // Hiển thị message với undo
        const key = `delete-${index}-${Date.now()}`;
        const hide = message.success({
            content: (
                <span>
                    Đã xóa bài tập{' '}
                    <Button
                        size="small"
                        type="link"
                        style={{ padding: 0, height: 'auto', marginLeft: 8 }}
                        onClick={() => {
                            handleUndoDelete(exercise, index);
                            hide();
                        }}
                    >
                        Hoàn tác
                    </Button>
                </span>
            ),
            key,
            duration: 5
        });
    };

    const handleUndoDelete = (exercise: ExercisePreview, originalIndex: number) => {
        setAIPreviewExercises((prev) => {
            const newExercises = [...prev];
            // Tìm vị trí phù hợp để insert lại
            const insertIndex = Math.min(originalIndex, newExercises.length);
            newExercises.splice(insertIndex, 0, exercise);
            return newExercises;
        });
        setDeletedExercises((prev) => prev.filter((item) => item.index !== originalIndex || item.exercise !== exercise));
        message.success('Đã khôi phục bài tập');
    };

    const handleUpdateExercise = (
        index: number,
        field: keyof ExercisePreview,
        value: string | number | boolean | string[] | null | undefined
    ) => {
        const newExercises = [...aiPreviewExercises];
        newExercises[index] = {
            ...newExercises[index],
            [field]: value
        };
        setAIPreviewExercises(newExercises);
    };

    const handleUpdateTestCase = (
        exerciseIndex: number,
        testCaseIndex: number,
        field: keyof ExercisePreview['testCases'][number],
        value: string | boolean | undefined
    ) => {
        const newExercises = [...aiPreviewExercises];
        newExercises[exerciseIndex].testCases[testCaseIndex] = {
            ...newExercises[exerciseIndex].testCases[testCaseIndex],
            [field]: value
        };
        setAIPreviewExercises(newExercises);
    };

    const handleDeleteTestCase = (exerciseIndex: number, testCaseIndex: number) => {
        const newExercises = [...aiPreviewExercises];
        newExercises[exerciseIndex].testCases = newExercises[exerciseIndex].testCases.filter(
            (_: unknown, i: number) => i !== testCaseIndex
        );
        setAIPreviewExercises(newExercises);
    };

    const handleAddTestCase = (exerciseIndex: number) => {
        const newExercises = [...aiPreviewExercises];
        const newTestCase = {
            input: '',
            output: '',
            note: '',
            isPublic: true
        };
        newExercises[exerciseIndex].testCases = [...newExercises[exerciseIndex].testCases, newTestCase];
        setAIPreviewExercises(newExercises);
    };


    const renderPrimaryActions = () => {
        if (aiStep === 0) {
    return (
                <>
                    <Button onClick={handleBackToExercises}>Hủy</Button>
                    <Button type="primary" loading={aiLoading} onClick={handleAIGenerate}>
                              Tạo bài tập
                          </Button>
                </>
            );
        }

        return (
            <>
                          <Button
                              onClick={() => {
                                  setAIStep(0);
                                  setAIPreviewExercises([]);
                              }}
                          >
                              Quay lại
                </Button>
                <Button onClick={handleBackToExercises}>Hủy</Button>
                <Button type="default" loading={singleCreateLoading} onClick={handleCreateSingleExercise}>
                    Tạo bài tập hiện tại
                </Button>
                <Button type="primary" loading={aiLoading} onClick={handleAICreateExercises}>
                              Tạo {aiPreviewExercises.length} bài tập
                          </Button>
            </>
        );
    };

    useEffect(() => {
        if (aiPreviewExercises.length === 0) {
            setActiveExerciseIndex(0);
            return;
        }

        if (activeExerciseIndex > aiPreviewExercises.length - 1) {
            setActiveExerciseIndex(aiPreviewExercises.length - 1);
        }
    }, [aiPreviewExercises.length, activeExerciseIndex]);

    useEffect(() => {
        setRunLoading(false);
        setHasRun(false);
        setRunResults([]);
        setRunError('');
    }, [activeExerciseIndex]);

    const handleSelectExercise = (index: number) => {
        setActiveExerciseIndex(index);
    };

    const getLanguageId = (exercise?: ExercisePreview) => {
        const lang = exercise?.solutionLanguage || solutionLanguage;
        if (!lang) return null;
        return LANGUAGE_ID_MAP[lang] ?? null;
    };

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchJudgeResults = async (tokens: string[]) => {
        if (!tokens.length) return [];
        const query = encodeURIComponent(tokens.join(','));
        const res = await fetch(
            `${JUDGE0_BASE_URL}/submissions/batch?tokens=${query}&base64_encoded=false&fields=token,status,stdout,stderr,time`
        );
        if (!res.ok) {
            throw new Error('Không thể lấy kết quả từ Judge0');
        }
        const data = (await res.json()) as JudgeSubmission[] | { submissions: JudgeSubmission[] };
        return Array.isArray(data) ? data : data.submissions || [];
    };

    const pollJudgeResults = async (tokens: string[]) => {
        let attempts = 0;
        let latest: JudgeSubmission[] = [];
        while (attempts < 10) {
            latest = await fetchJudgeResults(tokens);
            const hasPending = latest.some((item) => (item.status?.id ?? 0) <= 2);
            if (!hasPending) break;
            attempts++;
            await wait(800);
        }
        return latest;
    };

    const handleRunExercise = async () => {
        const exercise = aiPreviewExercises[activeExerciseIndex];
        if (!exercise) {
            message.warning('Vui lòng chọn bài tập trước khi chạy thử');
            return;
        }

        if (!exercise.solution || !exercise.solution.trim()) {
            message.warning('Bài này chưa có solution để chạy thử');
            return;
        }

        if (!exercise.testCases?.length) {
            message.warning('Bài này chưa có test case');
            return;
        }

        const languageId = getLanguageId(exercise);
        if (!languageId) {
            message.error('Ngôn ngữ solution chưa được hỗ trợ với Judge0');
            return;
        }

        setRunLoading(true);
        setHasRun(true);
        setRunResults([]);
        setRunError('');

        try {
            const submissionsPayload = exercise.testCases.map((testCase) => ({
                language_id: languageId,
                source_code: exercise.solution || '',
                stdin: testCase.input || '',
                expected_output: testCase.output || '',
                cpu_time_limit: Math.max(exercise.timeLimit || 1, 1),
                memory_limit: exercise.memory || 256000
            }));

            const response = await fetch(`${JUDGE0_BASE_URL}/submissions/batch?base64_encoded=false`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ submissions: submissionsPayload })
            });

            if (!response.ok) {
                throw new Error('Không thể gửi bài lên Judge0');
            }

            const submissionData = await response.json();
            const rawSubmissions = Array.isArray(submissionData)
                ? submissionData
                : submissionData.submissions || [];
            const tokens: string[] = rawSubmissions.map((item: { token?: string }) => item.token).filter(Boolean);

            if (!tokens.length) {
                throw new Error('Không nhận được token từ Judge0');
            }

            const judgeResults = await pollJudgeResults(tokens);

            const formattedResults: RunResult[] = judgeResults.map((result, index) => {
                const testCase = exercise.testCases[index];
                const stdout = (result.stdout || '').trim();
                const expected = (testCase?.output || '').trim();
                const statusId = result.status?.id ?? 0;

                return {
                    ...result,
                    index,
                    input: testCase?.input || '',
                    expected: testCase?.output || '',
                    isPassed: statusId === 3 && stdout === expected
                };
            });

            setRunResults(formattedResults);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi chạy thử';
            setRunError(errorMessage);
            setRunResults([]);
            message.error(errorMessage);
        } finally {
            setRunLoading(false);
        }
    };

    const renderRunnerResults = () => {
        if (runLoading) {
            return (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                    <Spin tip="Đang chạy các test case..." />
                </div>
            );
        }

        if (runError) {
            return (
                <div style={{ color: '#fecdd3', background: '#451a1a', padding: 12, borderRadius: 8 }}>
                    {runError}
                </div>
            );
        }

        if (!hasRun) {
            return <div>Chưa có lần chạy thử nào. Nhấn “Chạy thử” để bắt đầu.</div>;
        }

        if (!runResults.length) {
            return <div>Không có kết quả test nào được ghi nhận.</div>;
        }

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {runResults.map((result) => (
                    <div
                        key={result.token || result.index}
                        style={{
                            border: `1px solid ${result.isPassed ? '#10b981' : '#f87171'}`,
                            borderRadius: 10,
                            padding: 12,
                            background: result.isPassed ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ fontWeight: 600 }}>Test case #{result.index + 1}</div>
                            <Tag color={result.isPassed ? 'green' : 'red'}>
                                {result.status?.description || (result.isPassed ? 'Accepted' : 'Failed')}
                            </Tag>
                        </div>
                        <div style={{ fontSize: 12, color: '#cbd5f5', marginBottom: 4 }}>
                            Thời gian: {result.time ?? 'N/A'}s
                        </div>
                        <div style={{ fontSize: 12, color: '#cbd5f5' }}>
                            <div>🎯 Expected: <span style={{ color: '#f8fafc' }}>{result.expected || '""'}</span></div>
                            <div>📤 Output: <span style={{ color: '#f8fafc' }}>{(result.stdout || '').trim() || '""'}</span></div>
                            {result.stderr && (
                                <div>
                                    ⚠️ Stderr:{' '}
                                    <span style={{ color: '#fca5a5' }}>{result.stderr.trim().substring(0, 200)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderPreviewLayout = () => {
        if (aiPreviewExercises.length === 0) {
            return (
                <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 48 }}>
                    Danh sách bài tập trống. Sử dụng nút “Quay lại” để tạo mới.
                </div>
            );
        }

        const activeExercise = aiPreviewExercises[activeExerciseIndex];

        return (
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(280px, 32%) 1fr',
                    gap: 24,
                    minHeight: '70vh'
                }}
            >
                <div
                    style={{
                        border: '1px solid #ebeef5',
                        borderRadius: 12,
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                    }}
                >
                    <div>
                        <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>Danh sách bài tập</div>
                        <div style={{ fontWeight: 600, fontSize: 18 }}>Tổng {aiPreviewExercises.length} bài</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {aiPreviewExercises.map((exercise, index) => {
                            const isActive = index === activeExerciseIndex;
                            return (
                                <button
                                    key={exercise.code + index}
                                    type="button"
                                    onClick={() => handleSelectExercise(index)}
                                    style={{
                                        textAlign: 'left',
                                        borderRadius: 10,
                                        border: `1px solid ${isActive ? '#7c5dfa' : '#e5e7eb'}`,
                                        padding: '12px 14px',
                                        // background: '#f3f0ff ,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 4
                                    }}
                                >
                                    <div style={{ fontWeight: 600 }}>
                                        {index + 1}. {exercise.title || 'Untitled'}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                                        Độ khó: {exercise.difficulty} • Test case: {exercise.testCases.length}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {activeExercise && (
                        <div
                            style={{
                                marginTop: 8,
                                padding: 16,
                                borderRadius: 12,
                                border: '1px dashed #d6bbfb'
                            }}
                        >
                            <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>Thông tin nhanh</div>
                            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>{activeExercise.title}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>Giới hạn thời gian</div>
                                    <div style={{ fontWeight: 600 }}>{activeExercise.timeLimit}s</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>Bộ nhớ</div>
                                    <div style={{ fontWeight: 600 }}>{activeExercise.memory} bytes</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>Hiển thị</div>
                                    <div style={{ fontWeight: 600 }}>{activeExercise.visibility}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>Test case</div>
                                    <div style={{ fontWeight: 600 }}>{activeExercise.testCases.length}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        minHeight: '70vh'
                    }}
                >
                    {activeExercise && (
                        <>
                            <ExercisePreviewCard
                                key={activeExerciseIndex}
                                exercise={activeExercise}
                                index={activeExerciseIndex}
                                isEditing={editingIndex === activeExerciseIndex}
                                topics={topics}
                                onStartEdit={() => setEditingIndex(activeExerciseIndex)}
                                onStopEdit={() => setEditingIndex(null)}
                                onDelete={() => handleDeleteExercise(activeExerciseIndex)}
                                onUpdateExercise={(field, value) => handleUpdateExercise(activeExerciseIndex, field, value)}
                                onUpdateTestCase={(testCaseIndex, field, value) =>
                                    handleUpdateTestCase(activeExerciseIndex, testCaseIndex, field, value)
                                }
                                onDeleteTestCase={(testCaseIndex: number) =>
                                    handleDeleteTestCase(activeExerciseIndex, testCaseIndex)
                                }
                                onAddTestCase={() => handleAddTestCase(activeExerciseIndex)}
                            />
                            <div
                                style={{
                                    border: '1px solid #ebeef5',
                                    borderRadius: 12,
                                    padding: 20,
                                    color: '#e2e8f0'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
                                            Test Case Runner
                                        </div>
                                        <div style={{ fontSize: 18, fontWeight: 600 }}>Chạy thử code</div>
                                    </div>
                                    <Button type="primary" onClick={handleRunExercise} loading={runLoading} disabled={runLoading}>
                                        {runLoading ? 'Đang chạy...' : 'Chạy thử'}
                                    </Button>
                                </div>
                                <div
                                    style={{
                                        borderRadius: 8,
                                        padding: 16,
                                        minHeight: 140,
                                        fontFamily: 'monospace',
                                        fontSize: 13
                                    }}
                                >
                                    <div style={{ color: '#94a3b8', marginBottom: 8 }}>Kết quả</div>
                                    {renderRunnerResults()}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="ai-generate-exercises-page" style={{ padding: 24 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    marginBottom: 24
                }}
            >
                <div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Tạo câu hỏi bằng AI
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>FPTU Online Judge</div>
                    <div style={{ color: '#595959', maxWidth: 560 }}>{pageTitle}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {renderPrimaryActions()}
                </div>
            </div>
            <div
                style={{
                    borderRadius: 12,
                    padding: 24,
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                    minHeight: 'calc(100vh - 200px)'
                }}
        >
            {aiStep === 0 ? (
                <ExerciseForm
                    form={form}
                    topics={topics}
                    topicsLoading={topicsLoading}
                    selectedTopic={selectedTopic}
                    setSelectedTopic={setSelectedTopic}
                    selectedLevels={selectedLevels}
                    setSelectedLevels={setSelectedLevels}
                    numberOfExercise={numberOfExercise}
                    setNumberOfExercise={setNumberOfExercise}
                    numberOfPublicTestCases={numberOfPublicTestCases}
                    setNumberOfPublicTestCases={setNumberOfPublicTestCases}
                    numberOfPrivateTestCases={numberOfPrivateTestCases}
                    setNumberOfPrivateTestCases={setNumberOfPrivateTestCases}
                    solutionLanguage={solutionLanguage}
                    setSolutionLanguage={setSolutionLanguage}
                    prompt={prompt}
                    setPrompt={setPrompt}
                    visibility={visibility}
                    setVisibility={setVisibility}
                />
            ) : (
                    renderPreviewLayout()
                )}
            </div>
                </div>
    );
};

export default AIGenerateExercises;

