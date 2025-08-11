import React, { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { Course, Tutor } from '../types';
import Icon from '../components/common/Icon';
import Collapsible from '../components/common/Collapsible';
import ConfirmModal from '../components/modals/ConfirmModal';
import CourseModal from '../components/modals/CourseModal';
import TutorModal from '../components/modals/TutorModal';
import LectureModal from '../components/modals/LectureModal';
import ScreenshotModal from '../components/modals/ScreenshotModal';
import DownloadsManagement from '../components/admin/DownloadsManagement';
import { useFileUrl } from '../hooks/useFileUrl';
import SyllabusManagement from '../components/admin/SyllabusManagement';
import SyllabusModal from '../components/modals/SyllabusModal';
import SidebarManagement from '../components/admin/SidebarManagement';

// --- Sub-components for Admin Sections ---

const HomepageManagement: React.FC = () => {
    const { siteData, updateSiteData } = useApp();
    const [formData, setFormData] = useState({
        classroomName: siteData.classroomName,
        homeTitle: siteData.home.title,
        homeSubtitle: siteData.home.subtitle,
        upiNumber: siteData.paymentDetails.upiNumber,
        upiId: siteData.paymentDetails.upiId
    });
    
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = () => {
        updateSiteData({
            classroomName: formData.classroomName,
            home: { ...siteData.home, title: formData.homeTitle, subtitle: formData.homeSubtitle },
            paymentDetails: { upiId: formData.upiId, upiNumber: formData.upiNumber }
        });
        alert('Homepage changes saved!');
    };

    return (
        <Collapsible title="Homepage Management" startOpen={true}>
            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">General Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="classroomName" className="block text-sm font-medium text-gray-300">Classroom Name</label>
                            <input type="text" id="classroomName" value={formData.classroomName} onChange={handleInputChange} className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white" />
                        </div>
                        <div>
                            <label htmlFor="homeTitle" className="block text-sm font-medium text-gray-300">Homepage Title</label>
                            <input type="text" id="homeTitle" value={formData.homeTitle} onChange={handleInputChange} className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white" />
                        </div>
                        <div>
                            <label htmlFor="homeSubtitle" className="block text-sm font-medium text-gray-300">Homepage Subtitle</label>
                            <input type="text" id="homeSubtitle" value={formData.homeSubtitle} onChange={handleInputChange} className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white" />
                        </div>
                        <div>
                            <label htmlFor="upiNumber" className="block text-sm font-medium text-gray-300">Payment UPI Number</label>
                            <input type="text" id="upiNumber" value={formData.upiNumber} onChange={handleInputChange} className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white" />
                        </div>
                         <div>
                            <label htmlFor="upiId" className="block text-sm font-medium text-gray-300">Payment UPI ID</label>
                            <input type="text" id="upiId" value={formData.upiId} onChange={handleInputChange} className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-700 text-white" />
                        </div>
                    </div>
                </div>
                <div className="text-right border-t border-gray-700 pt-4">
                    <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">Save Homepage Changes</button>
                </div>
            </div>
        </Collapsible>
    );
};

const TutorRow: React.FC<{ tutor: Tutor, onEdit: (tutor: Tutor) => void, onDelete: (tutorId: number) => void }> = ({ tutor, onEdit, onDelete }) => {
    const photoUrl = useFileUrl(tutor.photoKey);
    return (
        <div className="p-3 border border-gray-700 rounded-lg bg-gray-700 flex items-center justify-between">
            <div className="flex items-center">
                <img src={photoUrl || `https://i.pravatar.cc/100?u=${tutor.id}`} className="w-12 h-12 rounded-full object-cover mr-4" alt={tutor.name}/>
                <div>
                    <p className="font-semibold text-white">{tutor.name}</p>
                    <p className="text-sm text-gray-400">{tutor.designation}</p>
                </div>
            </div>
            <div>
                <button onClick={() => onEdit(tutor)} className="text-blue-400 hover:text-blue-300 mr-2"><Icon name="edit" /></button>
                <button onClick={() => onDelete(tutor.id)} className="text-red-400 hover:text-red-300"><Icon name="trash" /></button>
            </div>
        </div>
    )
}

const TutorManagement: React.FC<{ onAdd: () => void; onEdit: (tutor: Tutor) => void; onDelete: (tutorId: number) => void; }> = ({ onAdd, onEdit, onDelete }) => {
    const { siteData } = useApp();
    return (
        <Collapsible title="Tutor Management">
            <div className="flex justify-end items-center mb-6">
                <button onClick={onAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                    <Icon name="plus" className="mr-2" /> Add New Tutor
                </button>
            </div>
            <div id="admin-tutors-list" className="space-y-4">
                {siteData.tutors.map(tutor => (
                   <TutorRow key={tutor.id} tutor={tutor} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </Collapsible>
    );
};

const CourseRow: React.FC<{ course: Course, onEdit: (course: Course) => void, onDelete: (courseId: number) => void, onManageLectures: (course: Course) => void }> = ({ course, onEdit, onDelete, onManageLectures }) => {
    const imageUrl = useFileUrl(course.imageKey);
    return (
        <tr className="border-b border-gray-700 hover:bg-gray-700">
            <td className="py-3 px-4">
                <div className="flex items-center">
                    <img src={imageUrl || 'https://placehold.co/100x100/1e293b/94a3b8?text=?'} alt={course.name} className="w-10 h-10 rounded-md object-cover mr-4"/>
                    <div className="font-semibold">{course.name}</div>
                </div>
            </td>
            <td className="py-3 px-4">{course.instructor}</td>
            <td className="py-3 px-4 text-center">{course.lectures.length}</td>
            <td className="py-3 px-4 text-center">
                <button onClick={() => onManageLectures(course)} className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600" title="Manage Lectures"><Icon name="list-alt" /></button>
                <button onClick={() => onEdit(course)} className="text-blue-400 hover:text-blue-300 mx-2" title="Edit Course"><Icon name="edit" /></button>
                <button onClick={() => onDelete(course.id)} className="text-red-400 hover:text-red-300" title="Delete Course"><Icon name="trash" /></button>
            </td>
        </tr>
    );
};

const CourseManagement: React.FC<{ onAdd: () => void; onEdit: (course: Course) => void; onDelete: (courseId: number) => void; onManageLectures: (course: Course) => void; }> = ({ onAdd, onEdit, onDelete, onManageLectures }) => {
    const { siteData } = useApp();
    return (
        <Collapsible title="Course Management">
            <div className="flex justify-end items-center mb-6">
                <button onClick={onAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                    <Icon name="plus" className="mr-2" /> Add New Course
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-800">
                    <thead className="bg-gray-700 text-gray-300">
                        <tr>
                            <th className="py-3 px-4 text-left">Course Name</th>
                            <th className="py-3 px-4 text-left">Instructor</th>
                            <th className="py-3 px-4 text-center">Lectures</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-300">
                        {siteData.courses.map(course => (
                            <CourseRow key={course.id} course={course} onEdit={onEdit} onDelete={onDelete} onManageLectures={onManageLectures} />
                        ))}
                    </tbody>
                </table>
            </div>
        </Collapsible>
    );
};

const PaymentVerification: React.FC<{ onViewScreenshot: (key: string) => void; }> = ({ onViewScreenshot }) => {
    const { siteData, approveVerification, rejectVerification } = useApp();
    const verifications = siteData.pendingVerifications || [];
    const badgeCount = verifications.length;

    return (
        <Collapsible title="Payment Verification" badgeCount={badgeCount}>
            <div className="space-y-4">
                {verifications.length === 0 ? (
                     <div className="text-center py-8 text-gray-500 bg-gray-900/50 rounded-md">No pending payments to verify.</div>
                ) : (
                    verifications.map(v => (
                         <div key={v.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <div>
                                    <p className="font-bold text-white">{v.userName}</p>
                                    <p className="text-sm text-gray-400">{v.userEmail}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-indigo-400">{v.courseName}</p>
                                    <p className="text-sm text-gray-400 font-mono" title="Transaction ID">TID: {v.transactionId}</p>
                                </div>
                                <div className="flex items-center justify-start md:justify-end space-x-2">
                                    <button onClick={() => onViewScreenshot(v.screenshotKey)} className="text-sm bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-500"><Icon name="image" className="mr-1" /> Screenshot</button>
                                    <button onClick={() => rejectVerification(v.id)} className="text-sm bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700"><Icon name="times" className="mr-1" /> Reject</button>
                                    <button onClick={() => approveVerification(v.id)} className="text-sm bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700"><Icon name="check" className="mr-1" /> Approve</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Collapsible>
    )
};

const ContactMessages: React.FC<{ onDelete: (messageId: number) => void }> = ({ onDelete }) => {
    const { siteData, updateContactMessageStatus } = useApp();
    const messages = siteData.contactMessages || [];
    const unreadCount = messages.filter(m => m.status === 'unread').length;

    return (
        <Collapsible title="Contact Messages" badgeCount={unreadCount}>
            <div className="space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-900/50 rounded-md">No contact messages received.</div>
                ) : (
                    messages.map(message => (
                        <div key={message.id} className={`p-4 rounded-lg border ${message.status === 'unread' ? 'bg-indigo-900/50 border-indigo-800' : 'bg-gray-800 border-gray-700'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-semibold text-white">{message.name}
                                        <span className="font-normal text-gray-400"> &lt;{message.email}&gt;</span>
                                        {message.status === 'unread' && <span className="ml-2 text-xs text-white bg-red-500 font-bold px-2 py-0.5 rounded-full">NEW</span>}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Received: {new Date(message.receivedAt).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                                    {message.status === 'unread' && (
                                        <button onClick={() => updateContactMessageStatus(message.id, 'read')} className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"><Icon name="check-double" className="mr-1" /> Mark as Read</button>
                                    )}
                                    <button onClick={() => onDelete(message.id)} className="text-gray-500 hover:text-red-500" title="Delete Message"><Icon name="trash-alt" /></button>
                                </div>
                            </div>
                            <pre className="bg-gray-900 p-3 rounded-md border border-gray-700 text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">{message.message}</pre>
                        </div>
                    ))
                )}
            </div>
        </Collapsible>
    )
}


// --- Main Admin Dashboard Component ---
const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { deleteCourse, deleteTutor, deleteContactMessage } = useApp();
    const [modalState, setModalState] = useState<{
        type: 'course' | 'tutor' | 'lecture' | 'confirm' | 'screenshot' | 'syllabus' | null;
        data?: any;
        onConfirm?: () => void;
    }>({ type: null });

    const openModal = (type: typeof modalState.type, data?: any, onConfirm?: () => void) => {
        setModalState({ type, data, onConfirm });
    };
    const closeModal = () => setModalState({ type: null });

    const handleDelete = (type: 'course' | 'tutor' | 'message', id: number) => {
        openModal('confirm',
            `Are you sure you want to delete this ${type}? This will also delete all associated files and cannot be undone.`,
            () => {
                if(type === 'course') deleteCourse(id);
                if(type === 'tutor') deleteTutor(id);
                if(type === 'message') deleteContactMessage(id);
                closeModal();
            }
        );
    };

    return (
        <>
            <div id="admin-dashboard" className="flex-1 flex flex-col overflow-y-auto bg-slate-900 text-white">
                <header className="bg-gray-800 text-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                    <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center">
                        <Icon name="arrow-left" className="mr-2" /> Back to Site
                    </button>
                </header>

                <main className="p-4 sm:p-6 lg:p-8 space-y-8">
                    <HomepageManagement />
                    
                    <SidebarManagement />

                    <TutorManagement
                        onAdd={() => openModal('tutor')}
                        onEdit={(tutor) => openModal('tutor', tutor)}
                        onDelete={(tutorId) => handleDelete('tutor', tutorId)}
                    />

                    <CourseManagement
                        onAdd={() => openModal('course')}
                        onEdit={(course) => openModal('course', course)}
                        onDelete={(courseId) => handleDelete('course', courseId)}
                        onManageLectures={(course) => openModal('lecture', course)}
                    />

                    <SyllabusManagement 
                        onAdd={() => openModal('syllabus')}
                        onEdit={(syllabus) => openModal('syllabus', syllabus)}
                    />
                    
                    <DownloadsManagement />

                    <PaymentVerification onViewScreenshot={(key) => openModal('screenshot', key)} />
                    
                    <ContactMessages onDelete={(messageId) => handleDelete('message', messageId)} />
                </main>
            </div>

            {/* --- Modals --- */}
            {modalState.type === 'confirm' && (
                <ConfirmModal
                    message={modalState.data}
                    onConfirm={modalState.onConfirm!}
                    onClose={closeModal}
                />
            )}
            {modalState.type === 'course' && (
                <CourseModal course={modalState.data} onClose={closeModal} />
            )}
            {modalState.type === 'tutor' && (
                <TutorModal tutor={modalState.data} onClose={closeModal} />
            )}
             {modalState.type === 'lecture' && (
                <LectureModal course={modalState.data} onClose={closeModal} />
            )}
            {modalState.type === 'screenshot' && (
                <ScreenshotModal imageKey={modalState.data} onClose={closeModal} />
            )}
            {modalState.type === 'syllabus' && (
                <SyllabusModal syllabus={modalState.data} onClose={closeModal} />
            )}
        </>
    );
};

export default AdminDashboard;