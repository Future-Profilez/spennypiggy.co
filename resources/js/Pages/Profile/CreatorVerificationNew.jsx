import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import EditProfile from "../account/EditProfile";
import Social from "../Auth/Social";
import { 
    BsCheckCircleFill, 
    BsXCircleFill,
    BsClockFill,
    BsShieldCheck,
    BsPersonBadge,
    BsCreditCard2Front,
    BsImage,
    BsChatText,
    BsStar,
    BsAward,
    BsBarChart,
    BsInfoCircle
} from "react-icons/bs";
import { 
    FaCheckCircle, 
    FaClock, 
    FaLock, 
    FaPlay,
    FaRocket, 
    FaUserCheck, 
    FaCoins,
    FaArrowRight,
    FaStar,
    FaHeart,
    FaUsers,
    FaThumbsUp,
    FaGift,
    FaExclamationTriangle
} from "react-icons/fa";
import { MdVerified, MdPending, MdWarning, MdDashboard, MdError } from "react-icons/md";
import { HiSparkles, HiLightningBolt, HiBadgeCheck } from "react-icons/hi";

export default function CreatorVerification({ IsloggedIn, fetchingLinks }) {
    const { auth, user, global_currency, slinks } = usePage().props;
    const [filledSteps, setFilledSteps] = useState(0);
    const [completedSteps, setCompletedSteps] = useState([]);
    const [activeStep, setActiveStep] = useState(null);
    const [showValidation, setShowValidation] = useState({});
    const [animatingStep, setAnimatingStep] = useState(null);

    const hasAnySocialMedia =
        slinks &&
        Object.values(slinks).some((value) => value !== null && value !== "");

    // Validation functions
    const validateStep = (step) => {
        const validations = {
            subscription: {
                isValid: auth?.user?.subscription_status >= 1,
                message: "Active subscription required to proceed",
                requirements: ["Start your 3-day free trial", "No charges until trial ends"]
            },
            social: {
                isValid: hasAnySocialMedia,
                message: "At least one social media account required",
                requirements: ["Account must be active", "Account must be older than 6 months", "Must be publicly accessible"]
            },
            avatar: {
                isValid: auth?.user?.avatar && auth?.user?.avatar_approved == 1,
                isPending: auth?.user?.avatar && auth?.user?.avatar_approved == 0,
                message: auth?.user?.avatar ? "Profile picture under review" : "Profile picture required",
                requirements: ["Clear, high-quality image", "Shows your face clearly", "Professional appearance", "No copyrighted content"]
            },
            bio: {
                isValid: auth?.user?.bio && auth?.user?.bio_approved == 1,
                isPending: auth?.user?.bio && auth?.user?.bio_approved == 0,
                message: auth?.user?.bio ? "Bio under review" : "Compelling bio required",
                requirements: ["At least 50 characters", "Describe what you create", "Professional and engaging", "No inappropriate content"]
            },
            identity: {
                isValid: auth?.user?.identity_status == 1,
                message: "Identity verification required for payments",
                requirements: ["Government-issued ID", "Clear photo quality", "Valid and current document"]
            },
            stripe: {
                isValid: auth?.user?.stripe_details_submitted == 1,
                message: "Payment account required to receive funds",
                requirements: ["Valid bank account", "Tax information", "Business details (if applicable)"]
            }
        };
        return validations[step.id] || { isValid: false, message: "Validation required" };
    };

    const getStepCompletion = () => {
        const basicSteps = verificationSteps.filter(s => s.category === 'basic');
        const verificationStepsOnly = verificationSteps.filter(s => s.category === 'verification');
        
        const basicCompleted = basicSteps.filter(s => s.isCompleted || s.isPending).length;
        const verificationCompleted = verificationStepsOnly.filter(s => s.isCompleted).length;
        
        return {
            basicSteps: basicSteps.length,
            basicCompleted,
            verificationSteps: verificationStepsOnly.length,
            verificationCompleted,
            totalSteps: verificationSteps.length,
            totalCompleted: filledSteps
        };
    };

    const updateProfileSteps = () => {
        window.location.reload(false);
    };

    // Define all verification steps with clear progression
    const verificationSteps = [
        {
            id: 'subscription',
            title: 'Start 3-Days Free Trial',
            description: 'Unlock full access with a Free Trial subscription of £4/month. No charges until the trial period ends.',
            isCompleted: auth?.user?.subscription_status >= 1,
            isRequired: true,
            order: 1,
            category: 'basic'
        },
        {
            id: 'social',
            title: 'Add Social Media Handles',
            description: 'Add at least one social media handle to help fans connect with you.',
            note: 'Account must be active and older than 6 months.',
            isCompleted: hasAnySocialMedia,
            isRequired: true,
            order: 2,
            category: 'basic'
        },
        {
            id: 'avatar',
            title: 'Upload Profile Picture',
            description: 'Add a clear, high-quality profile picture for your creator profile.',
            isCompleted: auth?.user?.avatar && auth?.user?.avatar_approved == 1,
            isPending: auth?.user?.avatar && auth?.user?.avatar_approved == 0,
            isRequired: true,
            order: 3,
            category: 'basic'
        },
        {
            id: 'bio',
            title: 'Write Profile Bio',
            description: 'Create a compelling bio that tells fans about yourself and what you create.',
            isCompleted: auth?.user?.bio && auth?.user?.bio_approved == 1,
            isPending: auth?.user?.bio && auth?.user?.bio_approved == 0,
            isRequired: true,
            order: 4,
            category: 'basic'
        },
        {
            id: 'identity',
            title: 'Identity Verification',
            description: 'Complete identity verification to secure your account and meet compliance requirements.',
            isCompleted: auth?.user?.identity_status == 1,
            isRequired: true,
            order: 5,
            category: 'verification',
            requiresApproval: true
        },
        {
            id: 'stripe',
            title: 'Connect Payment Account',
            description: 'Set up your Stripe account to receive payments from supporters.',
            isCompleted: auth?.user?.stripe_details_submitted == 1,
            isRequired: true,
            order: 6,
            category: 'verification',
            requiresApproval: true
        }
    ];

    useEffect(() => {
        const completed = verificationSteps.filter(step => step.isCompleted);
        setCompletedSteps(completed.map(step => step.id));
        setFilledSteps(completed.length);
    }, [auth?.user, hasAnySocialMedia]);

    // Helper functions
    const getStepStatus = (step) => {
        if (step.isCompleted) return 'completed';
        if (step.isPending) return 'pending';
        if (step.requiresApproval && auth?.user?.profile_status_lock != 2) return 'locked';
        return 'todo';
    };

    const getProgressPercentage = () => {
        return Math.round((filledSteps / verificationSteps.length) * 100);
    };

    const canProceedToFinalSteps = () => {
        const basicSteps = ['subscription', 'social', 'avatar', 'bio'];
        return basicSteps.every(stepId => 
            completedSteps.includes(stepId) || 
            verificationSteps.find(s => s.id === stepId)?.isPending
        );
    };

    const isFullyVerified = () => {
        return auth?.user?.profile_status_lock == 2 && filledSteps === verificationSteps.length;
    };

    const areBasicStepsCompleted = () => {
        const basicSteps = ['subscription', 'social', 'avatar', 'bio'];
        return basicSteps.every(stepId => {
            const step = verificationSteps.find(s => s.id === stepId);
            return step?.isCompleted || step?.isPending;
        });
    };

    const getOverallStatus = () => {
        if (isFullyVerified()) {
            return {
                type: 'success',
                title: '🎉 Verification Complete!',
                message: 'Your creator profile is fully verified and ready to earn.',
                icon: BsShieldCheck
            };
        }
        
        if (auth?.user?.profile_status_lock == 2) {
            const remainingSteps = verificationStepsFiltered.filter(step => !step.isCompleted).length;
            return {
                type: 'info',
                title: '✅ Profile Approved - Final Steps',
                message: `Complete ${remainingSteps} more verification step${remainingSteps > 1 ? 's' : ''} to start earning.`,
                icon: FaUserCheck
            };
        }
        
        if (auth?.user?.profile_status_lock == 1) {
            return {
                type: 'warning',
                title: '⏳ Under Review',
                message: 'Your profile is being reviewed. You can complete final steps while waiting.',
                icon: MdPending
            };
        }
        
        if (areBasicStepsCompleted()) {
            return {
                type: 'info',
                title: '🚀 Ready for Submission!',
                message: 'All basic steps completed! Your profile will be automatically submitted for review.',
                icon: FaRocket
            };
        }
        
        const remainingBasicSteps = basicSteps.filter(step => !step.isCompleted && !step.isPending).length;
        return {
            type: 'pending',
            title: '📝 Getting Started',
            message: `Complete ${remainingBasicSteps} more step${remainingBasicSteps > 1 ? 's' : ''} to submit for approval.`,
            icon: HiSparkles
        };
    };

    const getStepEstimatedTime = (step) => {
        const timeEstimates = {
            subscription: '2 minutes',
            social: '1 minute', 
            avatar: '3 minutes',
            bio: '5 minutes',
            identity: '10 minutes',
            stripe: '15 minutes'
        };
        return timeEstimates[step.id] || '5 minutes';
    };

    const basicSteps = verificationSteps.filter(step => step.category === 'basic');
    const verificationStepsFiltered = verificationSteps.filter(step => step.category === 'verification');

    return (
        <>
            <style>{`
                /* Revolutionary Wizard UI Styles */
                .wizard-container {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B73FF 100%);
                    border-radius: 24px;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 25px 50px rgba(102, 126, 234, 0.3);
                }
                
                .wizard-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
                    animation: shimmer 6s ease-in-out infinite;
                    pointer-events: none;
                }
                
                @keyframes shimmer {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                
                .glassmorphism {
                    background: rgba(255, 255, 255, 0.25);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.18);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }
                
                /* Step Progress Indicators */
                .status-completed {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
                    animation: successPulse 2s ease-in-out infinite;
                }
                
                .status-pending {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
                    animation: pendingSpin 3s linear infinite;
                }
                
                .status-locked {
                    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
                    color: white;
                    opacity: 0.7;
                }
                
                .status-active {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    box-shadow: 0 0 25px rgba(59, 130, 246, 0.6);
                    animation: activeGlow 2s ease-in-out infinite alternate;
                }
                
                @keyframes successPulse {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(16, 185, 129, 0.5); }
                    50% { transform: scale(1.1); box-shadow: 0 0 30px rgba(16, 185, 129, 0.8); }
                }
                
                @keyframes pendingSpin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes activeGlow {
                    from { 
                        box-shadow: 0 0 25px rgba(59, 130, 246, 0.6);
                        transform: scale(1);
                    }
                    to { 
                        box-shadow: 0 0 35px rgba(59, 130, 246, 0.9);
                        transform: scale(1.05);
                    }
                }
                
                /* Step Connector Animation */
                .step-connector {
                    height: 3px;
                    background: linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.8) 100%);
                    margin: 0 1rem;
                    position: relative;
                    border-radius: 2px;
                    overflow: hidden;
                }
                
                .step-connector::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%);
                    animation: connectorFlow 3s ease-in-out infinite;
                }
                
                @keyframes connectorFlow {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
                
                /* Revolutionary Step Cards */
                .step-card {
                    background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                }
                
                .step-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 2px;
                    background: linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%);
                    transition: left 0.5s ease-in-out;
                }
                
                .step-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                }
                
                .step-card:hover::before {
                    left: 100%;
                }
                
                .step-completed {
                    background: linear-gradient(145deg, #ecfdf5 0%, #f0fdf4 100%);
                    border-color: #10b981;
                    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.15);
                }
                
                .step-pending {
                    background: linear-gradient(145deg, #fffbeb 0%, #fefce8 100%);
                    border-color: #f59e0b;
                    box-shadow: 0 10px 25px rgba(245, 158, 11, 0.15);
                }
                
                .step-locked {
                    background: linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%);
                    border-color: #e2e8f0;
                    opacity: 0.7;
                }
                
                .step-todo {
                    background: linear-gradient(145deg, #ffffff 0%, #fafbff 100%);
                    border-color: #3b82f6;
                    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.1);
                }
                
                /* Step Numbers with Revolutionary Design */
                .step-number {
                    width: 3.5rem;
                    height: 3.5rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1.1rem;
                    margin-right: 1.5rem;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .step-number.completed {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
                    animation: completedBounce 0.6s ease-out;
                }
                
                .step-number.pending {
                    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                    color: white;
                    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.3);
                    animation: pendingPulse 2s ease-in-out infinite;
                }
                
                .step-number.locked {
                    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
                    color: white;
                    opacity: 0.6;
                }
                
                .step-number.todo {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
                    animation: todoGlow 3s ease-in-out infinite;
                }
                
                @keyframes completedBounce {
                    0% { transform: scale(0.3); }
                    50% { transform: scale(1.1); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); }
                }
                
                @keyframes pendingPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
                
                @keyframes todoGlow {
                    0%, 100% { box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3); }
                    50% { box-shadow: 0 12px 35px rgba(59, 130, 246, 0.5); }
                }
                
                /* Progress Ring Animation */
                .progress-ring {
                    transition: stroke-dasharray 1s ease-in-out;
                    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
                }
                
                /* Category Headers */
                .category-header {
                    margin-bottom: 2rem;
                    padding-bottom: 1rem;
                    border-bottom: 2px solid #e2e8f0;
                    position: relative;
                }
                
                .category-header::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    width: 60px;
                    height: 2px;
                    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                    border-radius: 2px;
                }
                
                /* Floating Animations */
                .floating-action {
                    animation: float 4s ease-in-out infinite;
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                
                /* Modern Button Styles */
                .modern-button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    padding: 0.75rem 1.5rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
                    position: relative;
                    overflow: hidden;
                }
                
                .modern-button::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
                    transition: left 0.5s ease;
                }
                
                .modern-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
                }
                
                .modern-button:hover::before {
                    left: 100%;
                }
                
                /* Responsive Design */
                @media (max-width: 768px) {
                    .wizard-container {
                        border-radius: 16px;
                        margin: 1rem;
                    }
                    
                    .step-card {
                        margin-bottom: 1rem;
                    }
                    
                    .step-number {
                        width: 3rem;
                        height: 3rem;
                        margin-right: 1rem;
                    }
                }
            `}</style>

            {/* Revolutionary Wizard Container */}
            <div className="wizard-container shadow-2xl">
                {/* Modern Header with Animated Background */}
                <div className="relative p-8 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center glassmorphism">
                                    <BsShieldCheck size={32} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-1">Creator Verification</h1>
                                    <p className="text-blue-100 text-lg">Your journey to earning starts here</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="relative w-20 h-20">
                                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="rgba(255,255,255,0.2)"
                                            strokeWidth="2"
                                        />
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeDasharray={`${getProgressPercentage()}, 100`}
                                            className="progress-ring"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold">{getProgressPercentage()}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Step Progress Indicator */}
                        <div className="flex items-center justify-between mb-4">
                            {verificationSteps.map((step, index) => {
                                const status = getStepStatus(step);
                                return (
                                    <div key={step.id} className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                            status === 'completed' ? 'status-completed' :
                                            status === 'pending' ? 'status-pending' :
                                            status === 'locked' ? 'status-locked' :
                                            'status-active'
                                        }`}>
                                            {status === 'completed' ? <FaCheckCircle size={16} /> :
                                             status === 'pending' ? <FaClock size={14} /> :
                                             status === 'locked' ? <FaLock size={14} /> :
                                             index + 1}
                                        </div>
                                        {index < verificationSteps.length - 1 && (
                                            <div className="step-connector flex-1"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Dynamic Status Message */}
                        <div className="glassmorphism rounded-lg p-4">
                            {(() => {
                                const status = getOverallStatus();
                                return (
                                    <div className="flex items-center space-x-3">
                                        <status.icon size={24} className="text-white" />
                                        <div>
                                            <h3 className="font-semibold text-lg">{status.title}</h3>
                                            <p className="text-blue-100 text-sm">{status.message}</p>
                                        </div>
                                    </div>
                                );
                            })()} 
                        </div>
                    </div>
                </div>
                
                {/* Content Section */}
                <div className="p-8">
                    {/* Enhanced Status Banner */}
                    {(() => {
                        const status = getOverallStatus();
                        const statusColors = {
                            success: 'bg-green-50 border-green-500 text-green-800',
                            info: 'bg-blue-50 border-blue-500 text-blue-800',
                            warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
                            pending: 'bg-purple-50 border-purple-500 text-purple-800',
                            error: 'bg-red-50 border-red-500 text-red-800'
                        };
                        
                        return (
                            <div className={`${statusColors[status.type]} border-l-4 p-6 mb-8 rounded-r-lg`}>
                                <div className="flex items-start">
                                    <status.icon className={`mt-1 mr-4 flex-shrink-0 ${status.type === 'success' ? 'text-green-500' : status.type === 'info' ? 'text-blue-500' : status.type === 'warning' ? 'text-yellow-500' : status.type === 'pending' ? 'text-purple-500' : 'text-red-500'}`} size={24} />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-2">
                                            {status.title}
                                        </h3>
                                        <p className="mb-4">
                                            {status.message}
                                        </p>
                                        
                                        {/* Additional Information Based on Status */}
                                        {auth?.user?.profile_status_lock == 1 && (
                                            <div className="bg-white bg-opacity-50 p-3 rounded-lg mt-3">
                                                <p className="text-sm font-medium mb-1">⏱️ Review Timeline:</p>
                                                <p className="text-sm">Usually 24-48 hours • You'll receive an email notification when approved</p>
                                            </div>
                                        )}
                                        
                                        {areBasicStepsCompleted() && auth?.user?.profile_status_lock == 0 && (
                                            <div className="bg-white bg-opacity-50 p-3 rounded-lg mt-3">
                                                <p className="text-sm font-medium mb-1">🚀 Next Steps:</p>
                                                <p className="text-sm">Your profile will be automatically submitted for admin review within a few minutes</p>
                                                <Link 
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm mt-2"
                                                    href="/update-profile-lock-status"
                                                >
                                                    Submit for Review Now
                                                </Link>
                                            </div>
                                        )}
                                        
                                        {isFullyVerified() && (
                                            <div className="bg-white bg-opacity-50 p-3 rounded-lg mt-3">
                                                <p className="text-sm font-medium mb-1">🎯 What's Next:</p>
                                                <div className="space-y-1 text-sm">
                                                    <p>• Create wish items and set up memberships</p>
                                                    <p>• Share your profile with supporters</p>
                                                    <p>• Start receiving payments and support</p>
                                                </div>
                                                <Link 
                                                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm mt-2"
                                                    href="/dashboard"
                                                >
                                                    Go to Dashboard
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    
                    {/* Rejection Message */}
                    {IsloggedIn && user?.profile_reject_reason != null && user?.profile_status_lock == 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-r-lg">
                            <div className="flex items-start">
                                <MdError className="text-red-500 mt-1 mr-4 flex-shrink-0" size={24} />
                                <div className="flex-1">
                                    <h3 className="text-red-800 font-semibold text-lg mb-2">
                                        Profile Verification Rejected
                                    </h3>
                                    <p className="text-red-700 mb-4">{user?.profile_reject_reason}</p>
                                    <div className="bg-white bg-opacity-50 p-3 rounded-lg mb-4">
                                        <p className="text-sm font-medium mb-1">📝 How to Fix:</p>
                                        <p className="text-sm">Review the rejection reason above, make necessary changes to your profile, then resubmit for review.</p>
                                    </div>
                                    <Link 
                                        className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                        href="/update-profile-lock-status"
                                    >
                                        Submit Re-verification Request
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic Profile Steps */}
                    <div className="category-header">
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Basic Profile Setup</h2>
                        <p className="text-gray-600">Complete these essential steps to submit your profile for review</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        {basicSteps.map((step, index) => {
                            const status = getStepStatus(step);
                            const stepNumber = index + 1;
                            
                            return (
                                <div 
                                    key={step.id} 
                                    className={`step-card rounded-xl p-6 transition-all duration-300 step-${status}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start flex-1">
                                            {/* Step Number/Icon */}
                                            <div className={`step-number ${status}`}>
                                                {step.isCompleted ? (
                                                    <FaCheckCircle size={18} />
                                                ) : step.isPending ? (
                                                    <FaClock size={16} />
                                                ) : (
                                                    stepNumber
                                                )}
                                            </div>
                                            
                                            {/* Step Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center mb-2">
                                                    <h3 className="text-xl font-semibold text-gray-900">
                                                        {step.title}
                                                    </h3>
                                                    <span className="ml-3 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                                                        Required
                                                    </span>
                                                    {!step.isCompleted && !step.isPending && (
                                                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                                            ~{getStepEstimatedTime(step)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 mb-3 leading-relaxed">
                                                    {step.description}
                                                </p>
                                                {step.note && !step.isCompleted && (
                                                    <div className="flex items-start p-3 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg mb-3">
                                                        <FaExclamationTriangle className="text-orange-500 mt-1 mr-2 flex-shrink-0" size={14} />
                                                        <p className="text-orange-700 text-sm font-medium">
                                                            {step.note}
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {/* Enhanced Status Messages with Validation */}
                                                {(() => {
                                                    const validation = validateStep(step);
                                                    
                                                    if (step.isPending) {
                                                        return (
                                                            <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                <div className="flex items-center mb-2">
                                                                    <FaClock className="mr-2 text-yellow-600" size={16} />
                                                                    <span className="font-medium text-yellow-800">Under Review</span>
                                                                </div>
                                                                <p className="text-sm text-yellow-700">
                                                                    Your submission is being reviewed by our team. This usually takes 24-48 hours.
                                                                </p>
                                                                <div className="mt-2 text-xs text-yellow-600">
                                                                    ⏰ Submitted • You'll receive email notification when approved
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    if (step.isCompleted) {
                                                        return (
                                                            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                                                <div className="flex items-center mb-2">
                                                                    <FaCheckCircle className="mr-2 text-green-600" size={16} />
                                                                    <span className="font-medium text-green-800">Completed Successfully</span>
                                                                </div>
                                                                <p className="text-sm text-green-700">
                                                                    ✅ This step has been approved and completed.
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    // Show validation requirements for incomplete steps
                                                    return (
                                                        <div className="mt-3">
                                                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                                                <div className="flex items-center mb-3">
                                                                    <BsInfoCircle className="mr-2 text-blue-600" size={16} />
                                                                    <span className="font-medium text-blue-800">Requirements</span>
                                                                </div>
                                                                <ul className="space-y-2 text-sm text-blue-700">
                                                                    {validation.requirements?.map((req, idx) => (
                                                                        <li key={idx} className="flex items-start">
                                                                            <span className="mr-2 text-blue-500 font-bold">•</span>
                                                                            {req}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                {!validation.isValid && (
                                                                    <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
                                                                        💡 Tip: {validation.message}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="ml-6">
                                            {step.id === 'subscription' && !step.isCompleted && (
                                                <Link
                                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium whitespace-nowrap shadow-lg"
                                                    href="/activate-subscription"
                                                >
                                                    Start Free Trial
                                                </Link>
                                            )}
                                            
                                            {step.id === 'social' && !step.isCompleted && (
                                                <div className="flex items-center">
                                                    <Social links={slinks} />
                                                </div>
                                            )}
                                            
                                            {step.id === 'avatar' && !step.isCompleted && !step.isPending && (
                                                <EditProfile
                                                    text="Upload Photo"
                                                    updateProfileSteps={updateProfileSteps}
                                                    user={user}
                                                    classes="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium whitespace-nowrap shadow-lg"
                                                    global_currency={global_currency}
                                                />
                                            )}
                                            
                                            {step.id === 'bio' && !step.isCompleted && !step.isPending && (
                                                <EditProfile
                                                    text="Write Bio"
                                                    updateProfileSteps={updateProfileSteps}
                                                    user={user}
                                                    classes="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium whitespace-nowrap shadow-lg"
                                                    global_currency={global_currency}
                                                />
                                            )}
                                            
                                            {step.isCompleted && (
                                                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                                                    ✓ Complete
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Verification Steps */}
                    <div className="category-header">
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Final Verification</h2>
                        <p className="text-gray-600">Complete these steps after your profile is approved to start receiving payments</p>
                    </div>

                    <div className="space-y-4">
                        {verificationStepsFiltered.map((step, index) => {
                            const status = getStepStatus(step);
                            const stepNumber = basicSteps.length + index + 1;
                            
                            return (
                                <div 
                                    key={step.id} 
                                    className={`step-card rounded-xl p-6 transition-all duration-300 step-${status}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start flex-1">
                                            {/* Step Number/Icon */}
                                            <div className={`step-number ${status}`}>
                                                {step.isCompleted ? (
                                                    <FaCheckCircle size={18} />
                                                ) : status === 'locked' ? (
                                                    <FaLock size={16} />
                                                ) : (
                                                    stepNumber
                                                )}
                                            </div>
                                            
                                            {/* Step Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center mb-2">
                                                    <h3 className="text-xl font-semibold text-gray-900">
                                                        {step.title}
                                                    </h3>
                                                    <span className="ml-3 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                                                        Final Step
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mb-3 leading-relaxed">
                                                    {step.description}
                                                </p>
                                                
                                                {/* Status Messages */}
                                                {status === 'locked' && (
                                                    <div className="flex items-center mt-3 text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                                                        <FaLock className="mr-2" size={16} />
                                                        <span>Complete profile approval first</span>
                                                    </div>
                                                )}
                                                {step.isCompleted && (
                                                    <div className="flex items-center mt-3 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                                                        <FaCheckCircle className="mr-2" size={16} />
                                                        <span className="font-medium">Completed ✓</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="ml-6">
                                            {step.id === 'identity' && !step.isCompleted && auth?.user?.profile_status_lock == 2 && (
                                                <Link
                                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium whitespace-nowrap shadow-lg"
                                                    href="/stripe/identity-verification"
                                                >
                                                    Verify Identity
                                                </Link>
                                            )}
                                            
                                            {step.id === 'stripe' && !step.isCompleted && auth?.user?.profile_status_lock == 2 && auth?.user?.identity_status == 1 && (
                                                <Link
                                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium whitespace-nowrap shadow-lg"
                                                    href="/stripe"
                                                >
                                                    Connect Stripe
                                                </Link>
                                            )}
                                            
                                            {step.isCompleted && (
                                                <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                                                    ✓ Complete
                                                </div>
                                            )}
                                            
                                            {status === 'locked' && (
                                                <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium">
                                                    Locked
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Help Section */}
                    {!isFullyVerified() && (
                        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <span className="text-2xl mr-2">💡</span>
                                Need Help?
                            </h3>
                            <div className="space-y-3 text-gray-700">
                                <div className="flex items-start">
                                    <span className="text-blue-600 mr-3 font-bold">1.</span>
                                    <p>Complete the basic profile steps (1-4) to submit your profile for admin review</p>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-blue-600 mr-3 font-bold">2.</span>
                                    <p>Once approved, you'll unlock identity verification and payment account setup</p>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-blue-600 mr-3 font-bold">3.</span>
                                    <p>The entire verification process typically takes 1-2 business days</p>
                                </div>
                                <div className="flex items-start">
                                    <span className="text-blue-600 mr-3 font-bold">4.</span>
                                    <p>After completion, you can create wish items, memberships, and receive payments</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
