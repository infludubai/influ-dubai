export declare class MailService {
    private readonly logger;
    sendVerificationEmail(to: string, link: string): Promise<void>;
    sendPasswordResetEmail(to: string, link: string): Promise<void>;
}
