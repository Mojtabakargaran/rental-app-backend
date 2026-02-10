import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * Initialize nodemailer SMTP transporter
   */
  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('email.host'),
      port: this.configService.get('email.port'),
      secure: this.configService.get('email.secure'),
      auth: {
        user: this.configService.get('email.user'),
        pass: this.configService.get('email.password'),
      },
    });

    this.logger.log('Email transporter initialized');
  }

  /**
   * Load and compile email templates
   */
  private loadTemplates(): void {
    const templatesDir = path.join(__dirname, '..', 'templates');
    const templateFiles = [
      'verification-email-en.hbs',
      'verification-email-fa.hbs',
      'password-reset-requested-en.hbs',
      'password-reset-requested-fa.hbs',
      'password-reset-completed-en.hbs',
      'password-reset-completed-fa.hbs',
      'welcome-email-en.hbs',
      'welcome-email-fa.hbs',
      'email-verification-profile-update-en.hbs',
      'email-verification-profile-update-fa.hbs',
      'account-deactivated-en.hbs',
      'account-deactivated-fa.hbs',
      'account-reactivated-en.hbs',
      'account-reactivated-fa.hbs',
      'password-changed-first-login-en.hbs',
      'password-changed-first-login-fa.hbs',
    ];

    templateFiles.forEach((filename) => {
      try {
        const filePath = path.join(templatesDir, filename);
        const templateContent = fs.readFileSync(filePath, 'utf-8');
        const compiled = Handlebars.compile(templateContent);
        this.templates.set(filename, compiled);
        this.logger.log(`Loaded template: ${filename}`);
      } catch (error) {
        this.logger.error(`Failed to load template ${filename}:`, error);
      }
    });
  }

  /**
   * Send verification email to newly registered user
   */
  async sendVerificationEmail(
    email: string,
    fullName: string,
    companyName: string,
    verificationToken: string,
    languagePreference: string,
  ): Promise<void> {
    // Build URL with user's language preference as locale
    const baseUrl = this.configService.get('email.verificationUrl');
    const locale = languagePreference === 'fa' ? 'fa' : 'en';
    const verificationUrl = `${baseUrl}/${locale}/verify-email?token=${verificationToken}`;
    
    const templateName =
      languagePreference === 'fa'
        ? 'verification-email-fa.hbs'
        : 'verification-email-en.hbs';

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const html = template({
      fullName,
      companyName,
      verificationUrl,
      currentYear: new Date().getFullYear(),
    });

    const subject =
      languagePreference === 'fa'
        ? 'تأیید حساب کاربری - سامانه مدیریت تجهیزات'
        : 'Verify Your Account - Equipment Rental Platform';

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset requested email (P2UC02)
   */
  async sendPasswordResetRequestedEmail(
    email: string,
    fullName: string,
    resetToken: string,
    languagePreference: string,
  ): Promise<void> {
    const baseUrl = this.configService.get('email.passwordResetUrl');
    const locale = languagePreference === 'fa' ? 'fa' : 'en';
    const resetUrl = `${baseUrl}/${locale}/reset-password?token=${resetToken}`;
    
    const templateName =
      languagePreference === 'fa'
        ? 'password-reset-requested-fa.hbs'
        : 'password-reset-requested-en.hbs';

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const html = template({
      fullName,
      resetUrl,
      currentYear: new Date().getFullYear(),
    });

    const subject =
      languagePreference === 'fa'
        ? 'بازیابی رمز عبور - سامانه مدیریت تجهیزات'
        : 'Password Reset Request - Equipment Rental Platform';

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send password reset completed email (P2UC02)
   */
  async sendPasswordResetCompletedEmail(
    email: string,
    fullName: string,
    passwordChangedAt: string,
    languagePreference: string,
  ): Promise<void> {
    const templateName =
      languagePreference === 'fa'
        ? 'password-reset-completed-fa.hbs'
        : 'password-reset-completed-en.hbs';

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    // Format timestamp for display
    const changedDate = new Date(passwordChangedAt);
    const formattedDate = languagePreference === 'fa'
      ? changedDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : changedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

    const html = template({
      fullName,
      passwordChangedAt: formattedDate,
      currentYear: new Date().getFullYear(),
    });

    const subject =
      languagePreference === 'fa'
        ? 'تأیید تغییر رمز عبور - سامانه مدیریت تجهیزات'
        : 'Password Changed Successfully - Equipment Rental Platform';

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send welcome email with temporary password (P4UC01)
   */
  async sendWelcomeEmail(
    email: string,
    fullName: string,
    temporaryPassword: string,
    roleCode: string,
    languagePreference: string,
  ): Promise<void> {
    const templateName =
      languagePreference === 'fa'
        ? 'welcome-email-fa.hbs'
        : 'welcome-email-en.hbs';

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    // Map role codes to display names
    const roleNames: Record<string, { en: string; fa: string }> = {
      MANAGER: { en: 'Manager', fa: 'مدیر' },
      STAFF: { en: 'Staff', fa: 'کارمند' },
      MAINTENANCE: { en: 'Maintenance', fa: 'تعمیرات' },
      READ_ONLY: { en: 'Read-Only', fa: 'فقط خواندنی' },
    };

    const roleName = roleNames[roleCode]
      ? languagePreference === 'fa'
        ? roleNames[roleCode].fa
        : roleNames[roleCode].en
      : roleCode;

    const baseUrl = this.configService.get('email.loginUrl');
    const locale = languagePreference === 'fa' ? 'fa' : 'en';
    const loginUrl = `${baseUrl}/${locale}/login`;

    const html = template({
      fullName,
      email,
      temporaryPassword,
      roleName,
      loginUrl,
      currentYear: new Date().getFullYear(),
    });

    const subject =
      languagePreference === 'fa'
        ? 'خوش آمدید - سامانه مدیریت تجهیزات'
        : 'Welcome to Equipment Rental Platform';

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send verification email after profile email update (P4UC04)
   */
  async sendEmailVerificationAfterProfileUpdate(
    email: string,
    fullName: string,
    oldEmail: string,
    verificationToken: string,
    languagePreference: string,
  ): Promise<void> {
    const baseUrl = this.configService.get('email.verificationUrl');
    const locale = languagePreference === 'fa' ? 'fa' : 'en';
    const verificationUrl = `${baseUrl}/${locale}/verify-email?token=${verificationToken}`;
    
    const templateName =
      languagePreference === 'fa'
        ? 'email-verification-profile-update-fa.hbs'
        : 'email-verification-profile-update-en.hbs';

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const html = template({
      fullName,
      oldEmail,
      newEmail: email,
      verificationUrl,
      currentYear: new Date().getFullYear(),
    });

    const subject =
      languagePreference === 'fa'
        ? 'تأیید آدرس ایمیل جدید - سامانه مدیریت تجهیزات'
        : 'Verify Your New Email Address - Equipment Rental Platform';

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send account deactivation notification email (P4UC05 - optional feature)
   */
  async sendAccountDeactivatedEmail(
    email: string,
    fullName: string,
    deactivatedAt: string,
    reason: string | undefined,
    languagePreference: string,
  ): Promise<void> {
    const templateName =
      languagePreference === 'fa'
        ? 'account-deactivated-fa.hbs'
        : 'account-deactivated-en.hbs';

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const deactivatedDate = new Date(deactivatedAt);
    const formattedDate = languagePreference === 'fa'
      ? deactivatedDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : deactivatedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

    const html = template({
      fullName,
      deactivatedAt: formattedDate,
      reason: reason || (languagePreference === 'fa' ? 'مشخص نشده' : 'Not specified'),
      currentYear: new Date().getFullYear(),
    });

    const subject =
      languagePreference === 'fa'
        ? 'غیرفعال‌سازی حساب کاربری - سامانه مدیریت تجهیزات'
        : 'Your Account Has Been Deactivated - Equipment Rental Platform';

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send account reactivation notification email (P4UC05 - optional feature)
   */
  async sendAccountReactivatedEmail(
    email: string,
    fullName: string,
    reactivatedAt: string,
    languagePreference: string,
  ): Promise<void> {
    const templateName =
      languagePreference === 'fa'
        ? 'account-reactivated-fa.hbs'
        : 'account-reactivated-en.hbs';

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const reactivatedDate = new Date(reactivatedAt);
    const formattedDate = languagePreference === 'fa'
      ? reactivatedDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : reactivatedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

    const baseUrl = this.configService.get('email.loginUrl');
    const locale = languagePreference === 'fa' ? 'fa' : 'en';
    const loginUrl = `${baseUrl}/${locale}/login`;

    const html = template({
      fullName,
      reactivatedAt: formattedDate,
      loginUrl,
      currentYear: new Date().getFullYear(),
    });

    const subject =
      languagePreference === 'fa'
        ? 'فعال‌سازی مجدد حساب کاربری - سامانه مدیریت تجهیزات'
        : 'Your Account Has Been Reactivated - Equipment Rental Platform';

    await this.sendEmail(email, subject, html);
  }

  /**
   * Send password changed on first login confirmation email (P4UC06)
   */
  async sendPasswordChangedFirstLoginEmail(
    email: string,
    fullName: string,
    passwordChangedAt: string,
    ipAddress: string,
    userAgent: string,
    languagePreference: string,
  ): Promise<void> {
    const templateName =
      languagePreference === 'fa'
        ? 'password-changed-first-login-fa.hbs'
        : 'password-changed-first-login-en.hbs';

    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    const changedDate = new Date(passwordChangedAt);
    const formattedDate = languagePreference === 'fa'
      ? changedDate.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : changedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

    const baseUrl = this.configService.get('email.loginUrl');
    const locale = languagePreference === 'fa' ? 'fa' : 'en';
    const loginUrl = `${baseUrl}/${locale}/login`;

    const html = template({
      fullName,
      passwordChangedAt: formattedDate,
      ipAddress,
      userAgent,
      loginUrl,
      currentYear: new Date().getFullYear(),
    });

    const subject =
      languagePreference === 'fa'
        ? 'رمز عبور با موفقیت تغییر کرد - سامانه مدیریت تجهیزات'
        : 'Password Successfully Changed - Equipment Rental Platform';

    await this.sendEmail(email, subject, html);
  }

  /**
   * Core email sending method with timeout
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    const timeout = this.configService.get('retry.sendTimeout');

    const sendPromise = this.transporter.sendMail({
      from: this.configService.get('email.from'),
      to,
      subject,
      html,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email send timeout')), timeout),
    );

    try {
      await Promise.race([sendPromise, timeoutPromise]);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}
