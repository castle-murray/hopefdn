import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { aboutArchiveImages, type ArchiveImage } from "@/data/about-archive-images";
import { site } from "@/data/site";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [{ title: "About Us | H.O.P.E. Foundation" }],
  }),
});

const services = [
  "Health Screenings",
  "Virginia DMV ID'S",
  "Birth Certificates",
  "G.E.D & Voter Registration",
  "Training",
  "Medicaid/Medicare Services",
  "Veteran Services",
  "And Many More...",
];

const shelterFigures = [
  "In 2015, according to HUD an estimated 7,001 people were homeless in Virginia.",
  "In 2016, there were approximately 3,959 homeless individuals and 2,309 homeless families with children.",
  "In 2019, officials counted 1,079 people in Hampton Roads cities homeless, such as, Norfolk, Chesapeake, Virginia Beach, Portsmouth, Hampton, Newport News, Suffolk.",
];

const firstYearHelp = [
  "Register to Vote",
  "Restore Their Civil Rights",
  "Obtain Homes",
  "Obtain Legal Identification",
  "Support & Counseling",
  "And More!",
];

const history: { year: string; items: string[] }[] = [
  {
    year: "2016",
    items: ["H.O.P.E. Foundation, Inc. begins serving Hampton Roads"],
  },
  {
    year: "2017",
    items: [
      "Started the first Summer Shelter in Hampton Roads",
      "Help Restoration of Civil Rights, Voting Education",
      'Began G.E.D. Preparation Services & Provided "Learn to Read in 100 Days" Literature.',
      "First Homeless Health Fair at St. Paul Church, Norfolk, VA.",
      "Happy Party (local business owner fundraiser event)",
      "Norfolk Mayor and City Council visit",
      "New Horizon Gospel performance for guests",
      "Pre-Thanksgiving Dinner",
      "Obtained State Commission Corporation License and 501(c)(3) status.",
      "Established shelter guidelines, check-in/out process, and separate sleeping arrangements.",
      "Engaged 30-50 volunteers and served 564 guests.",
      "Created Intake Forms and ICE (In Case of Emergency) forms.",
      "Provided Voter Education & Training, to registered new voters.",
      "Held a Golf Tournament raising funds.",
      "Distributed literature on “Learn to Read in 100 Days.”",
    ],
  },
  {
    year: "2018",
    items: [
      "Hosted Summer Shelter at Lighthouse Community Church",
      "Engaged 142 volunteers and served 682 guests.",
      "Refined check-in/out process and created ID cards.",
      "Started felons' civil rights restoration process.",
      "Conducted Voter Education & Training, and registered new voters.",
      "Facilitated housing allowances for 7 guests.",
      "Organized 2nd Annual Golf Tournament",
      "Provided literature on “Learn to Read in 100 Days.”",
    ],
  },
  {
    year: "2019",
    items: [
      "Began 3rd year of Summer Shelter at Oceanview Lighthouse Community Church",
      "Restored Civil Rights and Voting Education and provided IDs and certificates.",
      "Assisted guests with permanent housing.",
      "Held 3rd Annual Health Fair for Homeless",
    ],
  },
  {
    year: "2020",
    items: [
      "Empowered guests for transition to self-sufficiency",
      "Provided life skills improvement.",
      "Identified the personal goals of each guest.",
      "Encouraged monthly check-ins for accountability.",
      "Addressed mental/substance abuse challenges.",
      "Partnered with local providers for resources.",
    ],
  },
  {
    year: "2022 - 2023",
    items: [
      "Deliver guests' transition to self-sufficiency.",
      "Assist with life skills improvement.",
      "Uncover the personal goals of each guest.",
      "Address mental/substance abuse challenges.",
      "Incorporate monthly check-ins for accountability.",
      "Partner with local providers for resources",
    ],
  },
  {
    year: "2024",
    items: [
      "Embrace God's purpose for the H.O.P.E. Foundation",
      "Ensure sustained and expanded programs.",
      "Facilitate ID acquisition for guests.",
      "Lead comprehensive skill training for community empowerment.",
      "Introduce Financial Support programs.",
      "Implement personalized treatment plans.",
      "Secure stable facility for programs",
      "Actively pursue funding and sponsorship",
      "Solidify partnerships to enhance impact.",
      "Integrate HMIS with Privacy Act compliance.",
      "Establish a 90-day transition housing program.",
    ],
  },
];

const goals2025 = [
  "Expansion of Services: Aim to expand services to reach more individuals and families in need within the community.",
  "Increased Partnerships: Strengthen existing partnerships and establish new ones with local organizations, businesses, and government agencies to enhance support and resources for program participants.",
  "Permanent Facility: Work towards acquiring or establishing a permanent facility to provide stable and reliable support services, including shelter, counseling, and skill-building programs.",
  "Enhanced Program Offerings: Introduce new programs or enhance existing ones to address the evolving needs of the homeless population, including job training, mental health support, and substance abuse treatment.",
  "Empowerment and Self-Sufficiency: Empower program participants to transition from homelessness to self-sufficiency by providing comprehensive support, resources, and education in life skills, financial management, and job readiness.",
  "Advocacy and Awareness: Increase advocacy efforts to raise awareness about homelessness issues in the community and advocate for policy changes at the local and state levels to address systemic barriers to housing and support services.",
  "Measurement of Impact: Implement robust data collection and evaluation methods to measure the impact of programs and services on program participants’ lives, including tracking outcomes related to housing stability, employment, and overall well-being.",
  "Community Engagement: Strengthen community engagement initiatives, including volunteer opportunities, fundraising events, and educational campaigns, to foster a sense of belonging and support for individuals experiencing homelessness.",
  "Sustainability: Develop sustainable funding strategies, including diversifying funding sources, cultivating donor relationships, and pursuing grant opportunities, to ensure the long-term viability and impact of the organization’s programs and services.",
  "Continuous Improvement: Commit to ongoing evaluation and continuous improvement processes to adapt to changing community needs, address challenges, and maximize the organization’s effectiveness in fulfilling its mission of restoring faith, hope, and dignity in the community.",
];

const summaryResources = [
  "birth certificates and",
  "Social Security cards,",
  "voter registration,",
  "access to Medicaid & mental health resources,",
  "GED,",
  "skilled training programs, and",
  "safe shelter for those in need.",
];

const summarySupport = [
  "substance abuse counseling,",
  "domestic violence situations,",
  "continuing education opportunities,",
  "and more.",
];

const yearRound = [
  "Meals on Wheels",
  "Voter Restoration",
  "Regaining Credentials (e.g., Identification, Birth Certificate, Social Security Card)",
  "Educational Services (e.g., GED, College)",
  "Essentials (e.g., Clothing, Toiletries)",
  "Mental Wellness Support",
  "Transportation",
  "Mentorship",
];

const approach = [
  "The Love of God",
  "Generous contributions from individuals & organizations who believe in the impact they can have on the lives of individuals in need.",
  "Support from volunteers and philanthropic organizations striving to improve our community's well-being.",
  "Collaborations with businesses and churches using their influence to create a more supportive and inclusive community.",
];

const helpWays = [
  "Provide Bus Tickets",
  "Employment/Housing Opportunities",
  "Volunteering Your Time",
  "Non-Perishable Items",
  "Donating Goods or Services",
  "Becoming a Partner/Donating Funds",
];

const covidProvided = [
  "Home Cooked Meals",
  "Basic Necessities",
  "Resources",
  "Spiritual Needs",
];

const memorial = [
  "Rev. Willie Beatrice Sherrod – 4/8/2020",
  "Gregory Lee Rosser – 5/2/2020",
  "Mamie C. Woods – 1/27/2014",
  "Reginald Rosser – 5/6/2018",
  "Douglas Smith – 2019 (Guest)",
  "Robert Sr. & Georgianna Lawrence",
  "Betty Lawrence",
  "Robert Lawrence Jr.",
  "Joan E. Green – 5/10/2019",
  "Maurice Gregory",
  "Shawn Young – 7/4/2019 (Guest)",
  "Thomas L. Stokes – 5/19/2020 (Guest)",
  "Josephine Bragg – 8/22/2020",
  "Lee Arthur Sherrod III – 9/27/2020",
  "William Bernard Dudley – 11/17/2020",
  "Henry Wall – 1/8/2021 (Guest)",
  "Patrick Ferebee – 05/01/2022 (Guest)",
  "Karen Frith - 2022",
  "Rhonda L. Knickerbocker - 09/26/2023",
  "Parthenia Simmons Jones - 12/04/2023",
  "Darryl M. Turner - 02/13/68 - 12/19/2023",
  "Deborah Daniels - 2023",
  "Gerald Randall Bonney Sr. C/O Diane McCabe - 1/21/2024",
  "Clarius Dozier - 04/05/2024",
  "Theresa Templeman - 2024",
];

function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Helping Others Pursue Excellence"
        description="Homelessness is a situation, it’s not who you are."
      />

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <img
              src={aboutArchiveImages.logo.src}
              alt={aboutArchiveImages.logo.alt}
              width={aboutArchiveImages.logo.width}
              height={aboutArchiveImages.logo.height}
              className="mb-6 h-auto w-40 mix-blend-multiply sm:w-48"
              decoding="async"
              fetchPriority="high"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
              Our Motto
            </p>
            <p className="mt-3 font-display text-2xl font-semibold leading-snug text-navy">
              “Homelessness is a situation, it’s not who you are.”
            </p>
            <h2 className="mt-8 font-display text-3xl font-semibold text-navy">
              H.O.P.E. Foundation Serves Hampton Roads
            </h2>
            <Scripture
              text="And Jesus said unto him, Foxes have holes, and birds of the air have nests; but the Son of man hath not where to lay his head. For I was an hungered, and ye gave me no meat: I was thirsty, and ye gave me no drink."
              cite="Luke 9:58 (KJV)"
            />
            <div className="mt-6 space-y-4 text-base leading-relaxed text-muted">
              <p>
                The H.O.P.E. Foundation Inc. (Helping Others Pursue Excellence) is a non-profit organization dedicated to assisting unhoused individuals and families. We strive to give hope to those in need and help them gain the skills they need to become successful and independent.
              </p>
              <p>
                Our mission is to build strong communities and empower guests to rise above their current circumstances and achieve their dreams. Our commitment is to provide a safe and supportive environment for everyone and to make a lasting, positive impact on the lives of our guests.
              </p>
              <p>
                The foundation believes in the power of collaboration and works within the local community to bring about positive change.
              </p>
              <p>
                The foundation offers a wide range of services and programs that are tailored to the individual needs of the homeless (guests) we serve such as:
              </p>
            </div>
            <BulletList items={services} />
          </div>
          <div className="space-y-6">
            <StoryPhoto
              image={aboutArchiveImages.motto}
              sizes="(max-width: 1024px) 100vw, 50vw"
              eager
            />
            <StoryPhoto
              image={aboutArchiveImages.servesHamptonRoads}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            H.O.P.E. Summer Shelter
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            H.O.P.E. Summer Shelter is a much needed ministry to serve our community. We had 86 active volunteers within our first six months of operation. By 2021 we had over 200 volunteers.
          </p>
          <BulletList items={shelterFigures} />
          <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-muted">
            <p>
              Virginia saw its population of homeless drop 14.7% from 604 in 2015 to 515 in 2016.
            </p>
            <p>
              There is a coalition of churches that provide transient housing and food to the homeless from November through March. However, no program was provided in this area during the summer months.
            </p>
            <p>After the first year of operation, we were able to help our guests:</p>
          </div>
          <BulletList items={firstYearHelp} />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            H.O.P.E. Foundation - A Journey of Faith & Love
          </h2>
          <Scripture
            text="But whoever has this world’s goods, and sees his brother in need, and shuts up his heart from him, how does the love of God abide in him? My little children, let us not love in word or in tongue, but in deed and in truth."
            cite="1 John 3:17-18 (KJV)"
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {history.map((block) => (
              <article
                key={block.year}
                className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
              >
                <h3 className="font-display text-2xl font-semibold text-navy">
                  {block.year}
                </h3>
                <BulletList items={block.items} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            2025–26 Goals
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            Based on the organization’s mission and previous accomplishments, here are some goals and accomplishments you might expect from the organization in the upcoming 2025-26 year:
          </p>
          <BulletList items={goals2025} />
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">
            By setting and striving towards these goals, the organization can continue to make a significant and lasting impact on the lives of individuals and families experiencing homelessness, while also contributing to broader efforts to address homelessness and poverty in the community.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            Summary of H.O.P.E. Foundation
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            H.O.P.E. Foundation, Inc. is a beacon of hope for the under-represented homeless population, guided by biblical principles and a dedication to serving those in need. Our organization provides a wide range of essential resources, including:
          </p>
          <BulletList items={summaryResources} />
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted">
            We also offer support for:
          </p>
          <BulletList items={summarySupport} />
          <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-muted">
            <p>
              At the H.O.P.E. Foundation, we provide comprehensive programs and services that empower homeless individuals, restoring faith and hope in humanity by helping them pursue excellence.
            </p>
            <p>
              We believe in the inherent worth and dignity of every individual, and our goal is to uplift and support them on their journey toward self-sufficiency and stability.
            </p>
            <p>
              With a vision of working in partnership with others, we strive to improve the quality of human life and promote community betterment for our targeted demographic.
            </p>
            <p>
              Our ultimate goal is to establish a Gold Standard that glorifies God through our actions, words, and deeds, maintaining the highest level of integrity and commitment in all that we do. By honoring God and serving our community with dedication and compassion, we aim to make a meaningful and lasting impact on the lives of those we serve.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
            <div>
            <h2 className="font-display text-3xl font-semibold text-navy">
              Year-Round Services
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
              The H.O.P.E. Foundation is At The Forefront Of Prioritizing A Year-Round Dedication To Transforming The Lives Of The Unhoused Community In Hampton Roads And Beyond.
            </p>
            <h3 className="mt-8 font-display text-2xl font-semibold text-navy">
              Our Approach
            </h3>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
              At The H.O.P.E Foundation, We Are Dedicated To Supporting Those in need in of H.O.P.E. in the community. We Are On Call 24/7, 365 Days A Year. Our Initiatives Are Powered By:
            </p>
            <BulletList items={approach} />
            <h3 className="mt-8 font-display text-2xl font-semibold text-navy">
              H.O.P.E. Meals on Wheels
            </h3>
            <BulletList items={yearRound} />
            </div>
            <a
              href={aboutArchiveImages.mealsOnWheelsFlyer.original}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto block w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]"
            >
              <img
                src={aboutArchiveImages.mealsOnWheelsFlyer.src}
                srcSet={aboutArchiveImages.mealsOnWheelsFlyer.srcSet}
                sizes="(max-width: 1024px) 24rem, 22rem"
                alt={aboutArchiveImages.mealsOnWheelsFlyer.alt}
                width={aboutArchiveImages.mealsOnWheelsFlyer.width}
                height={aboutArchiveImages.mealsOnWheelsFlyer.height}
                className="h-auto w-full"
                loading="lazy"
                decoding="async"
              />
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            Fundraising
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            Our funding comes from donations, sponsors, fundraising events and grants.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-ivory py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            H.O.P.E. Foundation Directors & Board Members
          </h2>
          <p className="mt-3 text-base text-muted">
            Meet the dedicated Visionaries helping to further the cause of the H.o.P.E. Foundation
          </p>

          <h3 className="mt-10 font-display text-2xl font-semibold text-navy">
            Directors
          </h3>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <PersonCard
              name="Regina R. Darden"
              photo={aboutArchiveImages.reginaDarden}
              role="CEO Director"
              email="Regina@hopefdn.org"
            >
              <p>
                Regina’s life is now dedicated to being a “Voice for the homeless.” As the CEO of the H.O.P.E. Foundation Inc., a 501(c)(3) non-profit, she leads the charge in operating a Summer Shelter for the Homeless in Hampton Roads, Virginia, inspiring hope and advocating for those in need. In all endeavors, Regina remains steadfast in her commitment to God, viewing herself as an instrument of grace, mercy, and peace, and embracing the role of a beacon of hope for the homeless population in Hampton Roads. Remarkably, she emerged from the pandemic with a renewed purpose, as conveyed by nurses and doctors who saw a divine purpose in her survival.
              </p>
              <p>
                Professionally, Regina held medical nursing licenses, started “MRD Catering,” and worked as a Paralegal for Rutter and Mills Law firm and Norfolk Southern Railroad. Currently over 20 years as a Checker in Local 1624 at the International Longshoremen Association (I.L.A.), she also served as Business Manager for I.L.A. Ladies Auxiliary Local 37 and President of Asa Philip Randolph Institute (APRI) Hampton Roads Chapter. Now she’s studying for her bachelor’s degree in business administration and non for profit.
              </p>
              <p>Inspiring hope,</p>
              <p>Regina R. Darden</p>
            </PersonCard>
            <PersonCard
              name="Sylvia Boone"
              photo={aboutArchiveImages.sylviaBoone}
              role="Co-Director"
              email="Sylviaboone@hopefdn.org"
            >
              <p>
                Because I’m from a family that runs deep and wide, I know the look of having much as well as the look of not having enough or any at all. And I stand on the belief that the blesser is greater than the blessed. This is something that I recall whenever I have, and someone is in need I quickly remember, and even say out loud I am blessed to be a blessing. The H.O.P.E. Foundation provides that platform where we get to operate as a blessing, as we are being blessed simply by being an in position.
              </p>
            </PersonCard>
            <PersonCard
              name="Stephanie Brown"
              photo={aboutArchiveImages.stephanieBrown}
              role="Financial Director"
              email="Stephanie@hopefdn.org"
            >
              <p>
                My role with the Foundation is managing the Finances. I am a Financial Analyst Manager at a Fortune 500 Company. I have an Associate in Accounting, a Bachelor in Finance, and an MBA. When I volunteered I did not know what my position would be, I just wanted to help.
              </p>
            </PersonCard>
          </div>

          <h3 className="mt-12 font-display text-2xl font-semibold text-navy">
            Board Members
          </h3>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <PersonCard
              name="Karen Coronado"
              photo={aboutArchiveImages.karenCoronado}
              role="Board Member"
              email="Karenc@hopefdn.org"
            >
              <p>
                A native of Virginia, Karen’s passion for the homeless stemmed from her father, Nicanor who also had a passion for the homeless. Karen has been involved in several community outreaches and was the volunteer coordinator at Barrett Haven Homeless Shelter for single and pregnant women in Norfolk, VA. She has been a board member of H.O.P.E. Foundation, Inc. since 2017 and currently serves as the photographer. Her experience includes working with adults with mental illness and substance abuse. “We’re a blessing to be a blessing to others. The homeless are no exception.
              </p>
            </PersonCard>
            <PersonCard
              name="C. Richard Gillcrese"
              photo={aboutArchiveImages.richardGillcrese}
              role="Board Member"
              email="Richard@hopefdn.org"
            >
              <p>
                Owner at Nationtime Video. Former staff, board, Executive Director, program officer, now Vice Chairperson Board of Directors at Urban Youth Action, Inc.
              </p>
              <p>Former Executive Director at Barrett Haven Transitional Home</p>
              <p>
                Former Outreach Coordinator and Project Director at Minority Enterprise Development Corporation
              </p>
              <p>Studied Executive Management at Duquesne University</p>
              <p>Studied at University of Pittsburgh</p>
              <p>Lives in Chesapeake, Virginia</p>
              <p>From Pittsburgh, Pennsylvania</p>
              <p>Married</p>
            </PersonCard>
            <PersonCard
              name="Kathy LaVerne Dozier"
              photo={aboutArchiveImages.kathyDozier}
              role="Board Member"
              email="Kathy@hopefdn.org"
            >
              <p>
                Kathy LaVerne Dozier is the third child and daughter of the late Percy Lee Dozier and vibrantly living Clarius T. Dozier. She was born in Norfolk, Virginia, and raised in the Chesapeake. Kathy graduated from Indian River High School and later attended Tidewater Community College.
              </p>
              <p>
                In a summer revival, Kathy accepted the Lord as her Savior and was baptized in the Holy Spirit at nine years old. This was the beginning of her quest and hunger after God. When Kathy returned to serving God wholeheartedly, God saw fit to bless Kathy with four beautiful and miraculous children, Jeanise, Kelvin III, Kristopher, and Kristel then along came her 16 grandchildren.
              </p>
              <p>
                Serving God’s people became a passion that would not go away at a very young age. She has served and walked alongside several ministries in the Hampton Roads area and abroad. At this time Kathy enjoys volunteering for the H.O.P.E. Foundation, LLC while taking care of her mother and serving in other capacities such as advocating for those impacted by Domestic Violence and Sexual Assault.
              </p>
              <p>
                One day Kathy hopes to launch Eagles Nest Outreach. A ministry designed to assist a vulnerable population traumatized by homelessness. Eagles Nest will provide housing and financially assist individuals to remain housed. The second ministry will be Break The Cycle. This ministry will be a platform to educate, encourage, and empower individuals in transition due to life circumstances.
              </p>
            </PersonCard>
          </div>

          <h3 className="mt-12 font-display text-2xl font-semibold text-navy">
            Executive Advisors to Directors
          </h3>
          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            <PersonCard
              name="Dywona (Dee) Vantree-Keller, Esq."
              role="Executive Advisor to Directors"
            >
              <p>
                Dywona (Dee) Vantree-Keller, Esq., is the new Homeless Veterans Project Staff Attorney at the Legal Aid Society of Eastern Virginia. Dee works under the newly created ‘Virginia Legal Services for Homeless Veterans & Veterans At-Risk for Homelessness’ (LSV-H) grant. Dee’s role is to provide free legal services to homeless veterans, or those at risk for homelessness, in areas such as housing (eviction, landlord-tenant issues), disability, discharge, consumer issues, family law (custody, child support, divorce), and criminal offenses that can be a barrier to housing stability. Dee provides outreach at several food ministries. Those who come for meals and pantry items can meet with her to discuss their legal needs. Dee also conducts outreach at the Hampton VA Medical Center every second Friday of the month. Although Dee is new to Legal Aid, she has practiced law for more than 30 years. She owned her own law firm, DVKLAW, and her primary practice areas were criminal defense and family law. Dee “retired” in November 2023, but she “unretired” in August 2024 when she learned about the LSV-H Grant. Dee felt led to use her legal skills to help those who are most in need of help, those facing food and housing insecurity. She is honored to have been chosen to serve in this new role. Dee is a graduate of the College of William and Mary and Tulane University Law School. She is a member of Delta Sigma Theta Sorority, Inc. and serves as an Advisor to the Board of Directors for several nonprofit organizations.
              </p>
            </PersonCard>
            <PersonCard
              name="Dr. Jataune Jones"
              role="Executive Advisor to Directors"
              email="Jataune@hopefdn.org"
            >
              <p>
                Education is the key to success. My experiences include teaching students of military families in Baumholder, Germany, educating students in rural southeastern Virginia, serving as an administrator in three elementary schools, and providing educators and industry professionals a variety of learning experiences as a professional development administrator. I’m a proud Fulbright Memorial Fund Scholar and former Teacher of the Year with a passion for supporting the misunderstood learner, students with disabilities, and educators as they tool students with the strategies that prepare them for success.
              </p>
            </PersonCard>
            <PersonCard
              name="David Knickerbocker"
              photo={aboutArchiveImages.davidKnickerbocker}
              role="Executive Advisor to Directors"
              email="David@hopefdn.org"
            >
              <p>
                In 2022, David Knickerbocker joined H.O.P.E. Foundation as a web development consultant and transitioned to include a voluntary role, deeply moved by the foundation’s Christ-centered mission. With a degree in Paralegal Studies and Business Administration, he brings a decade of experience as a Digital Strategist, fortifying the foundation’s website as a consultant. As a voluntary Executive Advisor to Directors, David passionately aids the foundation’s initiatives, guided by the core commitment to God’s work and aiding others. Inspired by the team, he actively seeks growth as a Christian follower, family man, and businessman, expressing eternal gratitude for the transformative journey the foundation has helped him begin.
              </p>
            </PersonCard>
          </div>
          <Scripture
            text="Wherefore comfort yourselves together, and edify one another, even as also ye do."
            cite="1 Thess 5:11 (KJV)"
          />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div>
            <h2 className="font-display text-3xl font-semibold text-navy">
              Help End Homelessness Hampton Roads
            </h2>
            <Scripture
              text="Let all your things be done with charity."
              cite="1 Corinthians 16:14 (KJV)"
            />
            <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-muted">
              <p>
                Our funding comes from donations, sponsors, fundraising events and grants.
              </p>
              <p>
                In 2018-2019, we are able to provide shelter and warm food to the homeless in the Ocean View location with the help of The Lighthouse Community Church – 9609 9th Bay St., Norfolk, VA.
              </p>
              <p>
                In 2020-2021, Due to Coronavirus/COVID-19 and Social Distancing H.O.P.E. Meals on Wheels was started, we provided the homeless in our community with:
              </p>
            </div>
            <BulletList items={covidProvided} />
            </div>
            <StoryPhoto
              image={aboutArchiveImages.wavyRemarkablePerson}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            How You Can Help The H.O.P.E. Foundation
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            There are a few ways you individually, or your business and/or organization, can assist the H.O.P.E. Foundation in our journey to Help Others Pursue Excellence.
          </p>
          <BulletList items={helpWays} />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            In Memory Of...
          </h2>
          <Scripture
            text="For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
            cite="John 3:16 (KJV)"
          />
          <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {memorial.map((name) => (
              <li
                key={name}
                className="rounded-xl border border-border bg-surface-soft px-4 py-3 text-sm text-navy"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-cream/70 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-navy">
            H.O.P.E. Meals on Wheels
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted">
            H.O.P.E. Meals on Wheels has been feeding and supplying meals, resources, and basic needs to our guests in the Hampton Roads community, three days a week serving 60 to 100 guests a day, rain or shine. Approximately 8,969 meals were served during the 2022 calendar year. We also have been accepting nearly 160 calls per month through the H.O.P.E. phone line 757-241-6900.
          </p>
        </div>
      </section>

      <section id="contact" className="scroll-mt-28 border-t border-border bg-ivory py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                Get In Touch
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-navy">
                We'd love to hear from you
              </h2>
              <p className="mt-4 text-muted">
                Fill out the form below if you’re looking to reach the H.O.P.E. Foundation.
              </p>
              <ul className="mt-8 space-y-4 text-sm">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 size-5 text-gold-dark" aria-hidden />
                  <span>
                    {site.address.line1}
                    <br />
                    {site.address.line2}
                  </span>
                </li>
                <li>
                  <a
                    href={site.phoneHref}
                    className="inline-flex items-center gap-3 font-semibold text-navy hover:text-gold-dark"
                  >
                    <Phone className="size-5 text-gold-dark" aria-hidden />
                    {site.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={site.emailHref}
                    className="inline-flex items-center gap-3 font-semibold text-navy hover:text-gold-dark"
                  >
                    <Mail className="size-5 text-gold-dark" aria-hidden />
                    {site.email}
                  </a>
                </li>
              </ul>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}

function StoryPhoto({
  image,
  sizes,
  eager,
}: {
  image: ArchiveImage;
  sizes: string;
  eager?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl shadow-[var(--shadow-elevated)]">
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={sizes}
        alt={image.alt}
        width={image.width}
        height={image.height}
        className="aspect-[4/3] h-auto w-full object-cover object-center"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
      />
    </div>
  );
}

function Scripture({ text, cite }: { text: string; cite: string }) {
  return (
    <blockquote className="mt-6 max-w-3xl rounded-2xl border border-border bg-surface-soft p-6">
      <p className="font-display text-lg italic leading-relaxed text-navy">
        &ldquo;{text}&rdquo;
      </p>
      <cite className="mt-4 block text-xs font-semibold not-italic uppercase tracking-[0.14em] text-gold-dark">
        {cite}
      </cite>
    </blockquote>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PersonCard({
  name,
  role,
  email,
  photo,
  children,
}: {
  name: string;
  role: string;
  email?: string;
  photo?: ArchiveImage;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
      {photo ? (
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="(max-width: 1024px) 12rem, 10rem"
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          className="mb-5 aspect-square w-40 rounded-xl object-cover object-top sm:w-48 lg:w-40"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <h4 className="font-display text-xl font-semibold text-navy">{name}</h4>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
        {role}
      </p>
      {email ? (
        <p className="mt-3 text-sm">
          <a
            href={`mailto:${email}`}
            className="font-semibold text-navy hover:text-gold-dark"
          >
            {email}
          </a>
        </p>
      ) : null}
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </article>
  );
}

function ContactForm() {
  return (
    <form
      className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const subject = encodeURIComponent(
          `HOPE Foundation inquiry — ${String(data.get("topic") || "General")}`,
        );
        const body = encodeURIComponent(
          `Name: ${data.get("name")}\nEmail: ${data.get("email")}\nPhone: ${data.get("phone")}\nTopic: ${data.get("topic")}\n\n${data.get("message")}`,
        );
        window.location.href = `${site.emailHref}?subject=${subject}&body=${body}`;
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Phone" name="phone" type="tel" />
        <label className="block text-sm">
          <span className="mb-1.5 block font-semibold text-navy">I am interested in</span>
          <select
            name="topic"
            className="h-11 w-full rounded-md border border-border bg-ivory px-3 text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            defaultValue="Volunteer"
          >
            <option>Help / Guest Services</option>
            <option>Volunteer</option>
            <option>Donate</option>
            <option>Partnership</option>
            <option>General Information</option>
          </select>
        </label>
      </div>
      <label className="mt-4 block text-sm">
        <span className="mb-1.5 block font-semibold text-navy">Message</span>
        <textarea
          name="message"
          required
          rows={4}
          className="w-full rounded-md border border-border bg-ivory px-3 py-2.5 text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          placeholder="How can we help?"
        />
      </label>
      <Button type="submit" variant="default" size="lg" className="mt-5 w-full sm:w-auto">
        Send Message
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-semibold text-navy">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="h-11 w-full rounded-md border border-border bg-ivory px-3 text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}
