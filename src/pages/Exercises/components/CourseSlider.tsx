// import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Spin } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProtectedElement from '../../../components/ProtectedElement/ProtectedElement';

export interface CourseSliderItem {
    id: string;
    title: string;
    description?: string | null;
}

interface CourseSliderProps {
    courses: CourseSliderItem[];
    loading: boolean;
    onManageClick: () => void;
    onExploreCourse: (courseId: string) => void;
}

const CourseSlider = ({ courses, loading, onManageClick, onExploreCourse }: CourseSliderProps) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    canScrollLeft;
    const [canScrollRight, setCanScrollRight] = useState(false);
    canScrollRight;

    const updateScrollState = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        updateScrollState();
        const handleScroll = () => updateScrollState();
        el.addEventListener('scroll', handleScroll);
        return () => el.removeEventListener('scroll', handleScroll);
    }, [updateScrollState, courses.length]);

    // const handleScroll = (direction: 'left' | 'right') => {
    //     const el = trackRef.current;
    //     if (!el) return;
    //     const scrollAmount = el.clientWidth * 0.9;
    //     el.scrollBy({
    //         left: direction === 'left' ? -scrollAmount : scrollAmount,
    //         behavior: 'smooth'
    //     });
    // };

    return (
        <div className="course-slider">
            <div className="slider-header">
                <div>
                    <div className="slider-title">Khóa học nổi bật</div>
                    <div className="slider-subtitle">
                        Chọn khóa học phù hợp để luyện tập có lộ trình giống LeetCode study plan.
                    </div>
                </div>
                <ProtectedElement acceptRoles={['ADMIN']}>
                    <Button type="default" onClick={onManageClick}>
                        Quản lý khóa học
                    </Button>
                </ProtectedElement>
            </div>

            {loading ? (
                <div className="slider-loading">
                    <Spin />
                </div>
            ) : courses.length === 0 ? (
                <div className="slider-empty">Chưa có khóa học nào.</div>
            ) : (
                <div className="slider-body">
                    {/* <button
                        className="slider-nav slider-nav-left"
                        onClick={() => handleScroll('left')}
                        disabled={!canScrollLeft}
                        aria-label="Previous courses"
                    >
                        <LeftOutlined />
                    </button> */}
                    <div className="slider-window overflow">
                        <div className="slider-track" ref={trackRef}>
                            {courses.map((course, index) => (
                                <div className={`course-card theme-${(index % 6) + 1}`} key={course.id}>
                                    <div className="course-card-content">
                                        <div className="course-card-title">{course.title}</div>
                                        <div className="course-card-description max-2-lines">
                                            {course.description || '—'}
                                        </div>
                                    </div>
                                    <div className="course-card-footer">
                                        <span className="course-card-label">Course #{index + 1}</span>
                                        <Button type="link" size="small" onClick={() => onExploreCourse(course.id)}>
                                            Khám phá
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* <button
                        className="slider-nav slider-nav-right"
                        onClick={() => handleScroll('right')}
                        disabled={!canScrollRight}
                        aria-label="Next courses"
                    >
                        <RightOutlined />
                    </button> */}
                </div>
            )}
        </div>
    );
};

export default CourseSlider;
