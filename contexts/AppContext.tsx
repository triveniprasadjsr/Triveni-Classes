import React, { createContext, useState, useEffect, useCallback } from 'react';
import { SiteData, User, Course, Tutor, VerificationRequest, ContactMessage, Lecture, Enrollment, GeneralDownload, Syllabus, NavItem } from '../types';
import { getSiteData, saveSiteData, getUsers, saveUsers } from '../services/storage';
import { addFile, deleteFile } from '../services/db';
import { ADMIN_EMAIL } from '../constants';

interface AppContextType {
    siteData: SiteData;
    isLoading: boolean;
    currentUser: User | null;
    isLoggedIn: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
    signup: (name: string, email: string, password: string) => Promise<User>;
    updateSiteData: (data: Partial<SiteData>) => void;
    addCourse: (course: Omit<Course, 'id' | 'lectures' | 'imageKey'>, imageFile: File | null) => Promise<void>;
    updateCourse: (course: Course, imageFile: File | null) => Promise<void>;
    deleteCourse: (courseId: number) => void;
    addTutor: (tutor: Omit<Tutor, 'id' | 'photoKey'>, photoFile: File | null) => Promise<void>;
    updateTutor: (tutor: Tutor, photoFile: File | null) => Promise<void>;
    deleteTutor: (tutorId: number) => void;
    addLecture: (courseId: number, lecture: Omit<Lecture, 'id' | 'videoKey' | 'pdfKey'>, videoFile: File | null, pdfFile: File | null) => Promise<void>;
    updateLecture: (courseId: number, lecture: Lecture, videoFile: File | null, pdfFile: File | null) => Promise<void>;
    deleteLecture: (courseId: number, lectureId: number) => Promise<void>;
    updateLecturePdf: (courseId: number, lectureId: number, pdfFile: File) => Promise<void>;
    removeLecturePdf: (courseId: number, lectureId: number) => Promise<void>;
    addVerificationRequest: (request: Omit<VerificationRequest, 'id' | 'screenshotKey'>, screenshotFile: File) => Promise<void>;
    approveVerification: (verificationId: number) => Promise<void>;
    rejectVerification: (verificationId: number) => Promise<void>;
    addContactMessage: (message: Omit<ContactMessage, 'id' | 'status' | 'receivedAt'>) => void;
    updateContactMessageStatus: (messageId: number, status: 'read' | 'unread') => void;
    deleteContactMessage: (messageId: number) => void;
    addGeneralDownload: (title: string, pdfFile: File) => Promise<void>;
    updateGeneralDownload: (downloadId: number, title: string, pdfFile: File | null) => Promise<void>;
    deleteGeneralDownload: (downloadId: number) => Promise<void>;
    addSyllabus: (data: Omit<Syllabus, 'id' | 'pdfKey' | 'imageKey' | 'pdfFileName'>, pdfFile: File | null, imageFile: File | null) => Promise<void>;
    updateSyllabus: (syllabus: Syllabus, pdfFile: File | null, imageFile: File | null) => Promise<void>;
    deleteSyllabus: (syllabusId: number) => Promise<void>;
    updateNavItemsOrder: (items: NavItem[]) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [siteData, setSiteData] = useState<SiteData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const data = await getSiteData();
                setSiteData(data);

                const loggedInUserEmail = localStorage.getItem('loggedInUserEmail');
                if (loggedInUserEmail) {
                    const users = getUsers();
                    const user = users.find(u => u.email === loggedInUserEmail);
                    if (user) {
                        setCurrentUser(user);
                        setIsLoggedIn(true);
                        setIsAdmin(user.email === ADMIN_EMAIL);
                    }
                }
            } catch (error) {
                console.error("Failed to initialize app state:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, []);

    const updateAndSaveSiteData = useCallback((newSiteData: SiteData) => {
        setSiteData(newSiteData);
        saveSiteData(newSiteData);
    }, []);

    const login = async (email: string, password: string): Promise<User> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = getUsers();
                if (email.toLowerCase() === ADMIN_EMAIL && password === 'admin') {
                     let adminUser = users.find(u => u.email === ADMIN_EMAIL);
                     if(!adminUser){
                        adminUser = { name: 'Admin', email: ADMIN_EMAIL, password: 'admin', enrollments: [] };
                        users.push(adminUser);
                        saveUsers(users);
                     }
                     localStorage.setItem('loggedInUserEmail', ADMIN_EMAIL);
                     setCurrentUser(adminUser);
                     setIsLoggedIn(true);
                     setIsAdmin(true);
                     resolve(adminUser);
                     return;
                }

                const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
                if (user) {
                    localStorage.setItem('loggedInUserEmail', user.email);
                    setCurrentUser(user);
                    setIsLoggedIn(true);
                    setIsAdmin(false);
                    resolve(user);
                } else {
                    reject(new Error('Invalid email or password.'));
                }
            }, 500);
        });
    };
    
    const logout = () => {
        localStorage.removeItem('loggedInUserEmail');
        setCurrentUser(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
    };

    const signup = async (name: string, email: string, password: string): Promise<User> => {
         return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = getUsers();
                if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
                    return reject(new Error('An account with this email already exists.'));
                }
                const newUser: User = { name, email: email.toLowerCase(), password, enrollments: [] };
                users.push(newUser);
                saveUsers(users);
                resolve(newUser);
            }, 500);
        });
    };

    const updateSiteData = (data: Partial<SiteData>) => {
        if (!siteData) return;
        updateAndSaveSiteData({ ...siteData, ...data });
    };

    // --- Course Management ---
    const addCourse = async (courseData: Omit<Course, 'id' | 'lectures' | 'imageKey'>, imageFile: File | null) => {
        if (!siteData) return;
        const imageKey = imageFile ? await addFile(imageFile) : null;
        const newCourse: Course = { ...courseData, id: Date.now(), lectures: [], imageKey };
        updateAndSaveSiteData({ ...siteData, courses: [newCourse, ...siteData.courses] });
    };
    
    const updateCourse = async (course: Course, imageFile: File | null) => {
        if (!siteData) return;
        const updatedCourse = { ...course };
        if (imageFile) {
            if (updatedCourse.imageKey) await deleteFile(updatedCourse.imageKey);
            updatedCourse.imageKey = await addFile(imageFile);
        }
        const newCourses = siteData.courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
        updateAndSaveSiteData({ ...siteData, courses: newCourses });
    };

    const deleteCourse = (courseId: number) => {
        if (!siteData) return;
        // Also delete associated files from IndexedDB
        const course = siteData.courses.find(c => c.id === courseId);
        if (course) {
            if (course.imageKey) deleteFile(course.imageKey).catch(e => console.error(e));
            course.lectures.forEach(l => {
                if (l.videoKey) deleteFile(l.videoKey).catch(e => console.error(e));
                if (l.pdfKey) deleteFile(l.pdfKey).catch(e => console.error(e));
            });
        }
        updateAndSaveSiteData({ ...siteData, courses: siteData.courses.filter(c => c.id !== courseId) });
    };

    // --- Tutor Management ---
    const addTutor = async (tutorData: Omit<Tutor, 'id' | 'photoKey'>, photoFile: File | null) => {
        if (!siteData) return;
        const photoKey = photoFile ? await addFile(photoFile) : null;
        const newTutor: Tutor = { ...tutorData, id: Date.now(), photoKey };
        updateAndSaveSiteData({ ...siteData, tutors: [newTutor, ...siteData.tutors] });
    };

    const updateTutor = async (tutor: Tutor, photoFile: File | null) => {
        if (!siteData) return;
        const updatedTutor = { ...tutor };
        if (photoFile) {
            if (updatedTutor.photoKey) await deleteFile(updatedTutor.photoKey);
            updatedTutor.photoKey = await addFile(photoFile);
        }
        const newTutors = siteData.tutors.map(t => t.id === updatedTutor.id ? updatedTutor : t);
        updateAndSaveSiteData({ ...siteData, tutors: newTutors });
    };

    const deleteTutor = (tutorId: number) => {
        if (!siteData) return;
        const tutor = siteData.tutors.find(t => t.id === tutorId);
        if (tutor && tutor.photoKey) {
            deleteFile(tutor.photoKey).catch(e => console.error(e));
        }
        updateAndSaveSiteData({ ...siteData, tutors: siteData.tutors.filter(t => t.id !== tutorId) });
    };
    
    // --- Lecture Management ---
    const addLecture = async (courseId: number, lectureData: Omit<Lecture, 'id' | 'videoKey' | 'pdfKey'>, videoFile: File | null, pdfFile: File | null) => {
        if (!siteData) return;
        const videoKey = videoFile ? await addFile(videoFile) : null;
        const pdfKey = pdfFile ? await addFile(pdfFile) : null;

        const newLecture: Lecture = {
            ...lectureData,
            id: Date.now(),
            videoKey,
            pdfKey,
            pdfFileName: pdfFile ? pdfFile.name : null,
        };

        const newCourses = siteData.courses.map(c => c.id === courseId ? { ...c, lectures: [...c.lectures, newLecture] } : c);
        updateAndSaveSiteData({ ...siteData, courses: newCourses });
    };
    
    const updateLecture = async (courseId: number, lecture: Lecture, videoFile: File | null, pdfFile: File | null) => {
        if (!siteData) return;
        const updatedLecture = {...lecture};
        
        if (videoFile) {
            if (updatedLecture.videoKey) await deleteFile(updatedLecture.videoKey);
            updatedLecture.videoKey = await addFile(videoFile);
            updatedLecture.videoUrl = null; // Clear external URL if uploading a file
        }
        
        if (pdfFile) {
            if (updatedLecture.pdfKey) await deleteFile(updatedLecture.pdfKey);
            updatedLecture.pdfKey = await addFile(pdfFile);
            updatedLecture.pdfFileName = pdfFile.name;
        }

        const newCourses = siteData.courses.map(c => {
            if (c.id === courseId) {
                return { ...c, lectures: c.lectures.map(l => l.id === lecture.id ? updatedLecture : l) };
            }
            return c;
        });
        updateAndSaveSiteData({ ...siteData, courses: newCourses });
    };

    const deleteLecture = async (courseId: number, lectureId: number) => {
        if (!siteData) return;
        const newCourses = [...siteData.courses];
        const course = newCourses.find(c => c.id === courseId);
        if (course) {
            const lecture = course.lectures.find(l => l.id === lectureId);
            if (lecture) {
                if (lecture.videoKey) await deleteFile(lecture.videoKey);
                if (lecture.pdfKey) await deleteFile(lecture.pdfKey);
            }
            course.lectures = course.lectures.filter(l => l.id !== lectureId);
            updateAndSaveSiteData({ ...siteData, courses: newCourses });
        }
    };

    const updateLecturePdf = async (courseId: number, lectureId: number, pdfFile: File) => {
        if (!siteData) return;
        const pdfKey = await addFile(pdfFile);
        const pdfFileName = pdfFile.name;
        
        const newCourses = siteData.courses.map(c => {
            if (c.id === courseId) {
                const newLectures = c.lectures.map(l => {
                    if (l.id === lectureId) {
                        if (l.pdfKey) deleteFile(l.pdfKey).catch(e => console.error(e)); // delete old file
                        return { ...l, pdfKey, pdfFileName };
                    }
                    return l;
                });
                return { ...c, lectures: newLectures };
            }
            return c;
        });
        updateAndSaveSiteData({ ...siteData, courses: newCourses });
    };

    const removeLecturePdf = async (courseId: number, lectureId: number) => {
        if (!siteData) return;
        const newCourses = siteData.courses.map(c => {
            if (c.id === courseId) {
                const newLectures = c.lectures.map(l => {
                    if (l.id === lectureId) {
                        if (l.pdfKey) deleteFile(l.pdfKey).catch(e => console.error(e));
                        return { ...l, pdfKey: null, pdfFileName: null };
                    }
                    return l;
                });
                return { ...c, lectures: newLectures };
            }
            return c;
        });
        updateAndSaveSiteData({ ...siteData, courses: newCourses });
    };
    
    // --- Verification Management ---
    const addVerificationRequest = async (request: Omit<VerificationRequest, 'id' | 'screenshotKey'>, screenshotFile: File) => {
        if (!siteData || !currentUser) return;
        const screenshotKey = await addFile(screenshotFile);
        const newRequest = { ...request, id: Date.now(), screenshotKey };
        updateAndSaveSiteData({ ...siteData, pendingVerifications: [...siteData.pendingVerifications, newRequest] });
        
        const users = getUsers();
        const userIndex = users.findIndex(u => u.email === request.userEmail);
        if (userIndex !== -1) {
            users[userIndex].enrollments.push({ courseId: request.courseId, status: 'pending' });
            saveUsers(users);
            if(currentUser?.email === request.userEmail) {
                setCurrentUser(users[userIndex]);
            }
        }
    };
    
    const approveVerification = async (verificationId: number) => {
        if (!siteData) return;
        const request = siteData.pendingVerifications.find(v => v.id === verificationId);
        if (!request) return;

        if (request.screenshotKey) await deleteFile(request.screenshotKey);

        const users = getUsers();
        const userIndex = users.findIndex(u => u.email === request.userEmail);
        if (userIndex > -1) {
            const enrollmentIndex = users[userIndex].enrollments.findIndex(e => e.courseId === request.courseId && e.status === 'pending');
            if (enrollmentIndex > -1) {
                users[userIndex].enrollments[enrollmentIndex].status = 'enrolled';
                saveUsers(users);
            }
        }
        updateAndSaveSiteData({ ...siteData, pendingVerifications: siteData.pendingVerifications.filter(v => v.id !== verificationId) });
    };

    const rejectVerification = async (verificationId: number) => {
        if (!siteData) return;
        const request = siteData.pendingVerifications.find(v => v.id === verificationId);
        if (!request) return;
        
        if (request.screenshotKey) await deleteFile(request.screenshotKey);

        const users = getUsers();
        const userIndex = users.findIndex(u => u.email === request.userEmail);
        if (userIndex > -1) {
             users[userIndex].enrollments = users[userIndex].enrollments.filter(e => !(e.courseId === request.courseId && e.status === 'pending'));
             saveUsers(users);
        }
        updateAndSaveSiteData({ ...siteData, pendingVerifications: siteData.pendingVerifications.filter(v => v.id !== verificationId) });
    };
    
    // --- Contact Message Management ---
    const addContactMessage = (message: Omit<ContactMessage, 'id'|'status'|'receivedAt'>) => {
        if (!siteData) return;
        const newMessage: ContactMessage = { ...message, id: Date.now(), status: 'unread', receivedAt: new Date().toISOString() };
        updateAndSaveSiteData({ ...siteData, contactMessages: [newMessage, ...siteData.contactMessages] });
    };

    const updateContactMessageStatus = (messageId: number, status: 'read' | 'unread') => {
        if (!siteData) return;
        const newMessages = siteData.contactMessages.map(m => m.id === messageId ? {...m, status} : m);
        updateAndSaveSiteData({ ...siteData, contactMessages: newMessages });
    };

    const deleteContactMessage = (messageId: number) => {
        if (!siteData) return;
        updateAndSaveSiteData({ ...siteData, contactMessages: siteData.contactMessages.filter(m => m.id !== messageId) });
    };

    // --- General Downloads Management ---
    const addGeneralDownload = async (title: string, pdfFile: File) => {
        if (!siteData) return;
        const pdfKey = await addFile(pdfFile);
        const newDownload: GeneralDownload = {
            id: Date.now(),
            title,
            pdfKey,
            pdfFileName: pdfFile.name,
        };
        updateAndSaveSiteData({ ...siteData, generalDownloads: [newDownload, ...(siteData.generalDownloads || [])] });
    };

    const updateGeneralDownload = async (downloadId: number, title: string, pdfFile: File | null) => {
        if (!siteData) return;
        
        const newDownloads = [...(siteData.generalDownloads || [])];
        const downloadIndex = newDownloads.findIndex(d => d.id === downloadId);
        if (downloadIndex === -1) return;

        const updatedDownload = { ...newDownloads[downloadIndex], title };

        if (pdfFile) {
            if (updatedDownload.pdfKey) await deleteFile(updatedDownload.pdfKey);
            updatedDownload.pdfKey = await addFile(pdfFile);
            updatedDownload.pdfFileName = pdfFile.name;
        }

        newDownloads[downloadIndex] = updatedDownload;
        updateAndSaveSiteData({ ...siteData, generalDownloads: newDownloads });
    };

    const deleteGeneralDownload = async (downloadId: number) => {
        if (!siteData) return;

        const downloadToDelete = (siteData.generalDownloads || []).find(d => d.id === downloadId);
        if (downloadToDelete && downloadToDelete.pdfKey) {
            await deleteFile(downloadToDelete.pdfKey);
        }

        const newDownloads = (siteData.generalDownloads || []).filter(d => d.id !== downloadId);
        updateAndSaveSiteData({ ...siteData, generalDownloads: newDownloads });
    };

    // --- Syllabus Management ---
    const addSyllabus = async (data: Omit<Syllabus, 'id' | 'pdfKey' | 'imageKey' | 'pdfFileName'>, pdfFile: File | null, imageFile: File | null) => {
        if (!siteData) return;
        const pdfKey = pdfFile ? await addFile(pdfFile) : null;
        const imageKey = imageFile ? await addFile(imageFile) : null;

        const newSyllabus: Syllabus = {
            ...data,
            id: Date.now(),
            pdfKey,
            pdfFileName: pdfFile ? pdfFile.name : null,
            imageKey,
        };
        updateAndSaveSiteData({ ...siteData, syllabuses: [newSyllabus, ...(siteData.syllabuses || [])] });
    };

    const updateSyllabus = async (syllabus: Syllabus, pdfFile: File | null, imageFile: File | null) => {
        if (!siteData) return;
        const updatedSyllabus = { ...syllabus };

        if (pdfFile) {
            if (updatedSyllabus.pdfKey) await deleteFile(updatedSyllabus.pdfKey);
            updatedSyllabus.pdfKey = await addFile(pdfFile);
            updatedSyllabus.pdfFileName = pdfFile.name;
        }

        if (imageFile) {
            if (updatedSyllabus.imageKey) await deleteFile(updatedSyllabus.imageKey);
            updatedSyllabus.imageKey = await addFile(imageFile);
        }

        const newSyllabuses = (siteData.syllabuses || []).map(s => s.id === updatedSyllabus.id ? updatedSyllabus : s);
        updateAndSaveSiteData({ ...siteData, syllabuses: newSyllabuses });
    };

    const deleteSyllabus = async (syllabusId: number) => {
        if (!siteData) return;

        const syllabusToDelete = (siteData.syllabuses || []).find(s => s.id === syllabusId);
        if (syllabusToDelete) {
            if (syllabusToDelete.pdfKey) await deleteFile(syllabusToDelete.pdfKey).catch(e => console.error(e));
            if (syllabusToDelete.imageKey) await deleteFile(syllabusToDelete.imageKey).catch(e => console.error(e));
        }

        const newSyllabuses = (siteData.syllabuses || []).filter(s => s.id !== syllabusId);
        updateAndSaveSiteData({ ...siteData, syllabuses: newSyllabuses });
    };
    
    // --- NavItem Management ---
    const updateNavItemsOrder = (items: NavItem[]) => {
        if (!siteData) return;
        const orderedItems = items.map((item, index) => ({ ...item, order: index }));
        updateAndSaveSiteData({ ...siteData, navItems: orderedItems });
    };

    const value: AppContextType = {
        siteData: siteData!,
        isLoading,
        currentUser,
        isLoggedIn,
        isAdmin,
        login,
        logout,
        signup,
        updateSiteData,
        addCourse,
        updateCourse,
        deleteCourse,
        addTutor,
        updateTutor,
        deleteTutor,
        addLecture,
        updateLecture,
        deleteLecture,
        updateLecturePdf,
        removeLecturePdf,
        addVerificationRequest,
        approveVerification,
        rejectVerification,
        addContactMessage,
        updateContactMessageStatus,
        deleteContactMessage,
        addGeneralDownload,
        updateGeneralDownload,
        deleteGeneralDownload,
        addSyllabus,
        updateSyllabus,
        deleteSyllabus,
        updateNavItemsOrder,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};