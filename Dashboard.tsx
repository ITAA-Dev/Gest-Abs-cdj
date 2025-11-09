import React, { useState, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabaseClient } from './supabaseClient';
import { Level, Filiere, Group, Trainee } from './types';
import { initialLevels, initialFilieres, initialGroups, initialTrainees } from './constants';

// --- SVG Icons ---
const Icon = ({ path, className = "w-6 h-6" }: { path: string, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
);
const HomeIcon = () => <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />;
const PencilIcon = () => <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />;
const DatabaseIcon = () => <Icon path="M4 7v10m16-10v10M4 13h16M4 7a2 2 0 012-2h12a2 2 0 012 2m-2 10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />;
const ClockIcon = () => <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;
const LogoutIcon = () => <Icon path="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />;
const EyeIcon = () => <Icon className="w-5 h-5" path="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />;
const PencilAltIcon = () => <Icon className="w-5 h-5" path="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />;
const TrashIcon = () => <Icon className="w-5 h-5" path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
const PlusIcon = () => <Icon className="w-5 h-5 mr-2" path="M12 6v6m0 0v6m0-6h6m-6 0H6" />;

type View = 'dashboard' | 'weekly_entry' | 'data_management' | 'history';
type DataManagementTab = 'trainees' | 'groups' | 'filieres' | 'levels';

const DataManagement = () => {
    const [activeTab, setActiveTab] = useState<DataManagementTab>('trainees');
    const [levels] = useState<Level[]>(initialLevels);
    const [filieres] = useState<Filiere[]>(initialFilieres);
    const [groups] = useState<Group[]>(initialGroups);
    const [trainees] = useState<Trainee[]>(initialTrainees);

    const levelsById = useMemo(() => new Map(levels.map(l => [l.id, l])), [levels]);
    const filieresById = useMemo(() => new Map(filieres.map(f => [f.id, f])), [filieres]);
    const groupsById = useMemo(() => new Map(groups.map(g => [g.id, g])), [groups]);

    const renderContent = () => {
        switch (activeTab) {
            case 'trainees': return (
                // FIX: Added children to the Table component to satisfy its prop requirements.
                <Table title="Stagiaires" headers={['CEF', 'Nom', 'Prénom', 'Groupe']}>
                    {trainees.map(trainee => (
                        <tr key={trainee.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trainee.cef}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainee.lastName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainee.firstName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{groupsById.get(trainee.groupId)?.name}</td>
                            <ActionButtons />
                        </tr>
                    ))}
                </Table>
            );
            case 'groups': return (
                 // FIX: Added children to the Table component to satisfy its prop requirements.
                 <Table title="Groupes" headers={['Nom', 'Filière', 'Année Formation']}>
                    {groups.map(group => (
                        <tr key={group.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{filieresById.get(group.filiereId)?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.trainingYear}</td>
                            <ActionButtons />
                        </tr>
                    ))}
                </Table>
            );
            case 'filieres': return (
                 // FIX: Added children to the Table component to satisfy its prop requirements.
                 <Table title="Filières" headers={['Nom', 'Niveau']}>
                    {filieres.map(filiere => (
                        <tr key={filiere.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{filiere.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{levelsById.get(filiere.levelId)?.name}</td>
                            <ActionButtons />
                        </tr>
                    ))}
                </Table>
            );
            case 'levels': return (
                 // FIX: Added children to the Table component to satisfy its prop requirements.
                 <Table title="Niveaux" headers={['Nom']}>
                    {levels.map(level => (
                        <tr key={level.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{level.name}</td>
                            <ActionButtons />
                        </tr>
                    ))}
                </Table>
            );
            default: return null;
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestion des Données</h1>
            <div className="flex border-b border-gray-200">
                <TabButton name="Stagiaires" tab="trainees" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton name="Groupes" tab="groups" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton name="Filières" tab="filieres" activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabButton name="Niveaux" tab="levels" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div className="mt-6">{renderContent()}</div>
        </div>
    );
};

const TabButton = ({ name, tab, activeTab, setActiveTab }: { name: string, tab: DataManagementTab, activeTab: DataManagementTab, setActiveTab: (tab: DataManagementTab) => void }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-medium ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
    >{name}</button>
);

const Table = ({ title, headers, children }: { title: string, headers: string[], children: React.ReactNode }) => (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b">
            <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
            <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <PlusIcon/> Ajouter
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {headers.map(h => <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>)}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {children}
                </tbody>
            </table>
        </div>
    </div>
);

const ActionButtons = () => (
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-3">
            <button className="text-gray-400 hover:text-blue-600"><EyeIcon /></button>
            <button className="text-gray-400 hover:text-green-600"><PencilAltIcon /></button>
            <button className="text-gray-400 hover:text-red-600"><TrashIcon /></button>
        </div>
    </td>
);

const Dashboard = ({ session }: { session: Session }) => {
    const [currentView, setCurrentView] = useState<View>('data_management');

    const handleSignOut = async () => {
        await supabaseClient.auth.signOut();
    };

    const renderContent = () => {
        switch (currentView) {
            case 'data_management': return <DataManagement />;
            case 'dashboard': return <h1 className="text-3xl font-bold">Tableau de Bord</h1>;
            case 'weekly_entry': return <h1 className="text-3xl font-bold">Saisie par Semaine</h1>;
            case 'history': return <h1 className="text-3xl font-bold">Historique</h1>;
            default: return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-blue-900 text-white flex flex-col print:hidden">
                <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-blue-800">
                    Gestion Absences
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <NavItem name="Tableau de Bord" icon={<HomeIcon />} view="dashboard" currentView={currentView} setCurrentView={setCurrentView} />
                    <NavItem name="Saisie par Semaine" icon={<PencilIcon />} view="weekly_entry" currentView={currentView} setCurrentView={setCurrentView} />
                    <NavItem name="Gestion des Données" icon={<DatabaseIcon />} view="data_management" currentView={currentView} setCurrentView={setCurrentView} />
                    <NavItem name="Historique" icon={<ClockIcon />} view="history" currentView={currentView} setCurrentView={setCurrentView} />
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm h-16 flex justify-end items-center px-6 print:hidden">
                     <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">{session.user.email}</span>
                        <button onClick={handleSignOut} className="flex items-center text-sm text-gray-500 hover:text-red-600" title="Sign Out">
                           <LogoutIcon />
                        </button>
                    </div>
                </header>
                {/* Content Area */}
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

const NavItem = ({ name, icon, view, currentView, setCurrentView }: { name: string, icon: React.ReactNode, view: View, currentView: View, setCurrentView: (view: View) => void }) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); setCurrentView(view); }}
        className={`flex items-center px-4 py-2.5 rounded-lg transition-colors ${currentView === view ? 'bg-blue-700' : 'hover:bg-blue-800'}`}
    >
        {icon}
        <span className="ml-3">{name}</span>
    </a>
);

export default Dashboard;