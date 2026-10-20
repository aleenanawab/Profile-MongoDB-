import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { 
  DEFAULT_SECTION_ORDER, 
  DEFAULT_SECTION_VISIBILITY, 
  DEFAULT_SHARING_SETTINGS, 
  ProfileData 
} from '../src/types/profile';
import { founderProfile, companyProfile } from '../src/data/mockProfiles';
import { sanitizeProfileForPublic } from '../src/lib/db';
import { AboutSection } from '../src/components/AboutSection';
import { ProfileContactSection } from '../src/components/ProfileContactSection';
import { SkillsServicesSection } from '../src/components/SkillsServicesSection';
import { ExperienceSection } from '../src/components/ExperienceSection';
import { EducationSection } from '../src/components/EducationSection';
import { PortfolioSection } from '../src/components/PortfolioSection';
import { CertificationsSection } from '../src/components/CertificationsSection';
import { VolunteerSection } from '../src/components/VolunteerSection';
import { LanguagesSection } from '../src/components/LanguagesSection';
import { RecommendationsSection } from '../src/components/RecommendationsSection';
import { SocialLinksSection } from '../src/components/SocialLinksSection';
import { CompanyCard } from '../src/components/CompanyCard';
import { TeamSection } from '../src/components/TeamSection';
import { CustomFieldsSection } from '../src/components/CustomFieldsSection';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runPhase1Validation() {
  console.log('====================================================');
  console.log('PHASE 1 - ALEENA VALIDATION SUITE');
  console.log('Profile Structure & Required Sections Foundation');
  console.log('====================================================\n');

  // Sample filled profile based on real founder profile
  const filledProfile: ProfileData = {
    ...founderProfile,
    id: 'test-filled',
    slug: 'test-filled',
    education: [
      {
        id: 'edu-1',
        institution: 'Stanford University',
        degree: 'Master of Science',
        period: '2016 - 2018',
        description: 'Specialization in AI & Human-Computer Interaction.'
      }
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Avtive Cloud Identity Platform',
        description: 'Next-generation contactless profile and digital networking system.',
        tags: ['Next.js', 'TypeScript', 'Tailwind CSS']
      }
    ],
    certifications: [
      {
        id: 'cert-1',
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        issued: '2023'
      }
    ],
    volunteerExperiences: [
      {
        id: 'vol-1',
        organization: 'Code for America',
        role: 'Tech Mentor',
        period: '2021 - Present'
      }
    ],
    languages: [
      {
        language: 'English',
        proficiency: 'Native'
      },
      {
        language: 'Spanish',
        proficiency: 'Professional'
      }
    ],
    recommendations: [
      {
        id: 'rec-1',
        author: 'Sarah Connor',
        designation: 'VP of Product',
        company: 'Tech Corp',
        summary: 'An outstanding leader and visionary technologist.'
      }
    ],
    customFields: [
      {
        id: 'cf-1',
        label: 'Portfolio Code',
        value: 'https://github.com/founder/repo',
        type: 'link'
      }
    ]
  };

  const emptyProfile: ProfileData = {
    id: 'test-empty',
    type: 'individual',
    slug: 'test-empty',
    name: 'Blank Candidate',
    avatar: '/images/default-avatar.png',
    location: '',
    bio: '',
    about: '',
    shortBio: '',
    fullBio: '',
    phone: '',
    email: '',
    website: '',
    experiences: [],
    experience: [],
    education: [],
    projects: [],
    skills: [],
    services: [],
    certifications: [],
    volunteerExperiences: [],
    languages: [],
    recommendations: [],
    socials: [],
    socialLinks: [],
    customFields: [],
    companyInfo: undefined,
    teamMembers: [],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sectionVisibility: { ...DEFAULT_SECTION_VISIBILITY }
  };

  // ----------------------------------------------------
  // TEST 1 — Filled Profile: All Sections Render Data
  // ----------------------------------------------------
  console.log('--- TEST 1: Filled Profile Section Rendering & Data Preservation ---');
  try {
    const aboutHtml = renderToStaticMarkup(<AboutSection profile={filledProfile} />);
    assert(aboutHtml.includes('About'), 'Filled AboutSection renders header');
    assert(aboutHtml.includes('Strategy-based artist'), 'Filled AboutSection preserves bio');

    const contactHtml = renderToStaticMarkup(<ProfileContactSection profile={filledProfile} />);
    assert(contactHtml.includes('Contact'), 'Filled ProfileContactSection renders header');
    assert(contactHtml.includes(filledProfile.email || 'mesum@avtive.app'), 'Filled ProfileContactSection preserves email');

    const skillsHtml = renderToStaticMarkup(<SkillsServicesSection profile={filledProfile} />);
    assert(skillsHtml.includes('SERVICES') && skillsHtml.includes('Skills'), 'Filled SkillsServicesSection renders headers');
    assert(skillsHtml.includes('Brand Design'), 'Filled SkillsServicesSection preserves services');

    const expHtml = renderToStaticMarkup(<ExperienceSection profile={filledProfile} />);
    assert(expHtml.includes('Experience'), 'Filled ExperienceSection renders header');
    assert(expHtml.includes('Avtive'), 'Filled ExperienceSection preserves experiences');

    const eduHtml = renderToStaticMarkup(<EducationSection profile={filledProfile} />);
    assert(eduHtml.includes('Education'), 'Filled EducationSection renders header');
    assert(eduHtml.includes('Stanford University'), 'Filled EducationSection preserves school name');

    const projHtml = renderToStaticMarkup(<PortfolioSection profile={filledProfile} />);
    assert(projHtml.includes('Projects'), 'Filled PortfolioSection renders header');
    assert(projHtml.includes('Avtive Cloud Identity Platform'), 'Filled PortfolioSection preserves projects');

    const certHtml = renderToStaticMarkup(<CertificationsSection profile={filledProfile} />);
    assert(certHtml.includes('Certifications'), 'Filled CertificationsSection renders header');
    assert(certHtml.includes('AWS Certified Solutions Architect'), 'Filled CertificationsSection preserves certification title');

    const volHtml = renderToStaticMarkup(<VolunteerSection profile={filledProfile} />);
    assert(volHtml.includes('Volunteer Experience'), 'Filled VolunteerSection renders header');
    assert(volHtml.includes('Code for America'), 'Filled VolunteerSection preserves organization name');

    const langHtml = renderToStaticMarkup(<LanguagesSection profile={filledProfile} />);
    assert(langHtml.includes('Languages'), 'Filled LanguagesSection renders header');
    assert(langHtml.includes('English'), 'Filled LanguagesSection preserves language item');

    const recHtml = renderToStaticMarkup(<RecommendationsSection profile={filledProfile} />);
    assert(recHtml.includes('Recommendations'), 'Filled RecommendationsSection renders header');
    assert(recHtml.includes('Sarah Connor'), 'Filled RecommendationsSection preserves author name');

    const socialHtml = renderToStaticMarkup(<SocialLinksSection profile={filledProfile} />);
    assert(socialHtml.includes('SOCIAL &amp; PROFESSIONAL LINKS') || socialHtml.includes('SOCIAL & PROFESSIONAL LINKS'), 'Filled SocialLinksSection renders header');
    assert(socialHtml.includes('linkedin.com') || socialHtml.includes('LinkedIn'), 'Filled SocialLinksSection preserves link');

    const companyHtml = renderToStaticMarkup(<CompanyCard companyInfo={filledProfile.companyInfo} />);
    assert(companyHtml.includes('Avtive'), 'Filled CompanyCard preserves company name');

    const teamHtml = renderToStaticMarkup(<TeamSection profile={companyProfile} />);
    assert(teamHtml.includes('Our Team'), 'Filled TeamSection renders header');
    assert(teamHtml.includes('Syed Mesum Raza Shah'), 'Filled TeamSection preserves team member');

    const cfHtml = renderToStaticMarkup(<CustomFieldsSection profile={filledProfile} />);
    assert(cfHtml.includes('Portfolio Code'), 'Filled CustomFieldsSection preserves custom field');
  } catch (err: any) {
    assert(false, 'Filled Section Test Exception', err.message);
  }

  // ----------------------------------------------------
  // TEST 2 — Empty Profile: All Sections Remain Available (No Disappearing, No Crash)
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Empty Profile Section Availability (Never Disappears / Never Crashes) ---');
  try {
    const emptyAbout = renderToStaticMarkup(<AboutSection profile={emptyProfile} />);
    assert(emptyAbout !== '' && emptyAbout.includes('No bio or story added yet.'), 'Empty AboutSection renders fallback and does NOT return null');

    const emptyContact = renderToStaticMarkup(<ProfileContactSection profile={emptyProfile} />);
    assert(emptyContact !== '' && emptyContact.includes('No contact information provided yet.'), 'Empty ContactSection renders fallback and does NOT return null');

    const emptySkills = renderToStaticMarkup(<SkillsServicesSection profile={emptyProfile} />);
    assert(emptySkills !== '' && emptySkills.includes('No skills added yet.') && emptySkills.includes('No services listed yet.'), 'Empty SkillsServicesSection renders fallbacks and does NOT return null');

    const emptyExp = renderToStaticMarkup(<ExperienceSection profile={emptyProfile} />);
    assert(emptyExp !== '' && emptyExp.includes('No work experience added yet.'), 'Empty ExperienceSection renders fallback and does NOT return null');

    const emptyEdu = renderToStaticMarkup(<EducationSection profile={emptyProfile} />);
    assert(emptyEdu !== '' && emptyEdu.includes('No education details added yet.'), 'Empty EducationSection renders fallback and does NOT return null');

    const emptyProjects = renderToStaticMarkup(<PortfolioSection profile={emptyProfile} />);
    assert(emptyProjects !== '' && emptyProjects.includes('No projects added yet.'), 'Empty PortfolioSection renders fallback and does NOT return null');

    const emptyCert = renderToStaticMarkup(<CertificationsSection profile={emptyProfile} />);
    assert(emptyCert !== '' && emptyCert.includes('No certifications added yet.'), 'Empty CertificationsSection renders fallback and does NOT return null');

    const emptyVol = renderToStaticMarkup(<VolunteerSection profile={emptyProfile} />);
    assert(emptyVol !== '' && emptyVol.includes('No volunteer experience added yet.'), 'Empty VolunteerSection renders fallback and does NOT return null');

    const emptyLang = renderToStaticMarkup(<LanguagesSection profile={emptyProfile} />);
    assert(emptyLang !== '' && emptyLang.includes('No language proficiencies added yet.'), 'Empty LanguagesSection renders fallback and does NOT return null');

    const emptyRec = renderToStaticMarkup(<RecommendationsSection profile={emptyProfile} />);
    assert(emptyRec !== '' && emptyRec.includes('No recommendations added yet.'), 'Empty RecommendationsSection renders fallback and does NOT return null');

    const emptySocial = renderToStaticMarkup(<SocialLinksSection profile={emptyProfile} />);
    assert(emptySocial !== '' && emptySocial.includes('No social or professional links added yet.'), 'Empty SocialLinksSection renders fallback and does NOT return null');

    const emptyCompany = renderToStaticMarkup(<CompanyCard companyInfo={emptyProfile.companyInfo} />);
    assert(emptyCompany !== '' && emptyCompany.includes('No company profile linked yet.'), 'Empty CompanyCard renders fallback and does NOT return null or throw');

    const emptyTeam = renderToStaticMarkup(<TeamSection profile={emptyProfile} />);
    assert(emptyTeam !== '' && emptyTeam.includes('No team members listed yet.'), 'Empty TeamSection renders fallback and does NOT return null');

    const emptyCf = renderToStaticMarkup(<CustomFieldsSection profile={emptyProfile} />);
    assert(emptyCf !== '' && emptyCf.includes('No custom fields added yet.'), 'Empty CustomFieldsSection renders fallback and does NOT return null');
  } catch (err: any) {
    assert(false, 'Empty Section Test Exception', err.message);
  }

  // ----------------------------------------------------
  // TEST 3 — Mixed Profile: Filled Sections Show Data, Empty Sections Show Fallbacks
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Mixed Profile (Some Filled, Some Empty) ---');
  try {
    const mixedProfile: ProfileData = {
      ...emptyProfile,
      name: 'Morgan Stanley',
      bio: 'Senior Infrastructure Engineer specializing in distributed databases.',
      shortBio: 'Senior Infrastructure Engineer specializing in distributed databases.',
      email: 'morgan@example.com',
      experiences: [
        {
          id: 'exp-1',
          role: 'Staff Database Architect',
          company: 'CloudScale Inc',
          period: '2020 - Present',
          current: true,
          description: 'Architecting distributed databases.'
        }
      ],
      skills: ['PostgreSQL', 'Distributed Systems']
      // Education, Certifications, Volunteer, Languages, Recommendations, Socials remain EMPTY
    };

    // Filled components
    const mixedAbout = renderToStaticMarkup(<AboutSection profile={mixedProfile} />);
    assert(mixedAbout.includes('Senior Infrastructure Engineer'), 'Mixed: AboutSection shows user data');

    const mixedExp = renderToStaticMarkup(<ExperienceSection profile={mixedProfile} />);
    assert(mixedExp.includes('Staff Database Architect') && mixedExp.includes('CloudScale Inc'), 'Mixed: ExperienceSection shows experience');

    const mixedSkills = renderToStaticMarkup(<SkillsServicesSection profile={mixedProfile} />);
    assert(mixedSkills.includes('PostgreSQL'), 'Mixed: SkillsSection shows skill tag');
    assert(mixedSkills.includes('No services listed yet.'), 'Mixed: Services shows empty fallback while skills shows data');

    // Empty components
    const mixedEdu = renderToStaticMarkup(<EducationSection profile={mixedProfile} />);
    assert(mixedEdu.includes('No education details added yet.'), 'Mixed: Empty Education section displays fallback');

    const mixedCert = renderToStaticMarkup(<CertificationsSection profile={mixedProfile} />);
    assert(mixedCert.includes('No certifications added yet.'), 'Mixed: Empty Certifications section displays fallback');

    const mixedVol = renderToStaticMarkup(<VolunteerSection profile={mixedProfile} />);
    assert(mixedVol.includes('No volunteer experience added yet.'), 'Mixed: Empty Volunteer section displays fallback');

    const mixedLang = renderToStaticMarkup(<LanguagesSection profile={mixedProfile} />);
    assert(mixedLang.includes('No language proficiencies added yet.'), 'Mixed: Empty Languages section displays fallback');

    const mixedRec = renderToStaticMarkup(<RecommendationsSection profile={mixedProfile} />);
    assert(mixedRec.includes('No recommendations added yet.'), 'Mixed: Empty Recommendations section displays fallback');

    const mixedSocial = renderToStaticMarkup(<SocialLinksSection profile={mixedProfile} />);
    assert(mixedSocial.includes('No social or professional links added yet.'), 'Mixed: Empty SocialLinks section displays fallback');
  } catch (err: any) {
    assert(false, 'Mixed Profile Test Exception', err.message);
  }

  // ----------------------------------------------------
  // TEST 4 — Existing Functionality, Fallbacks & Defaults
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Existing Functionality, Schema Defaults & Sanitization ---');
  try {
    // 1. Dual field support: 'experience' vs 'experiences'
    const legacyExpProfile: ProfileData = {
      ...emptyProfile,
      experience: [
        {
          id: 'exp-legacy',
          role: 'Founding Engineer',
          company: 'Legacy Startup',
          period: '2018 - 2020',
          description: 'Early architecture'
        }
      ]
    };
    const legacyExpHtml = renderToStaticMarkup(<ExperienceSection profile={legacyExpProfile} />);
    assert(legacyExpHtml.includes('Founding Engineer') && legacyExpHtml.includes('Legacy Startup'), 'ExperienceSection supports legacy profile.experience property');

    // 2. Dual field support: 'socialLinks' vs 'socials'
    const legacySocialProfile: ProfileData = {
      ...emptyProfile,
      socialLinks: [
        {
          platform: 'github',
          url: 'https://github.com/developer',
          label: 'GitHub'
        }
      ]
    };
    const legacySocialHtml = renderToStaticMarkup(<SocialLinksSection profile={legacySocialProfile} />);
    assert(legacySocialHtml.includes('github.com/developer') || legacySocialHtml.includes('GitHub'), 'SocialLinksSection supports profile.socialLinks property');

    // 3. DEFAULT_SECTION_VISIBILITY integrity
    const requiredSections = [
      'about',
      'contact',
      'skills',
      'services',
      'experience',
      'education',
      'projects',
      'certifications',
      'volunteer',
      'languages',
      'recommendations',
      'socialLinks',
      'socials',
      'company',
      'custom-fields'
    ];
    for (const sec of requiredSections) {
      assert(DEFAULT_SECTION_VISIBILITY[sec] === true, `DEFAULT_SECTION_VISIBILITY has ${sec}: true`);
    }

    // 4. Sanitization logic for public profile when hidden in sharing settings
    const privateProfile: ProfileData = {
      ...founderProfile,
      sharingSettings: {
        ...DEFAULT_SHARING_SETTINGS,
        education: false,
        experience: false,
        socialLinks: false,
        bio: false,
        companySection: false
      }
    };
    const sanitized = sanitizeProfileForPublic(privateProfile, false);
    assert(Array.isArray(sanitized.education) && sanitized.education.length === 0, 'Sanitization empties education when sharingSettings.education is false');
    assert(Array.isArray(sanitized.experiences) && sanitized.experiences.length === 0, 'Sanitization empties experiences when sharingSettings.experience is false');
    assert(Array.isArray(sanitized.socials) && sanitized.socials.length === 0, 'Sanitization empties socials when sharingSettings.socialLinks is false');
    assert(sanitized.bio === '' && sanitized.shortBio === '', 'Sanitization empties bio when sharingSettings.bio is false');
    assert(sanitized.companyInfo === undefined, 'Sanitization empties companyInfo when sharingSettings.companySection is false');

  } catch (err: any) {
    assert(false, 'Test 4 Exception', err.message);
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase1Validation().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
