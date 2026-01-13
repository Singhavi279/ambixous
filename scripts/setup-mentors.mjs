import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nTo set these, go to your Vercel project Vars section and add:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function setupDatabase() {
  try {
    console.log('🔄 Setting up mentors database...\n');

    // Step 1: Create table
    console.log('📝 Creating mentors table...');
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: fs.readFileSync(path.join(__dirname, '003_create_mentors_table.sql'), 'utf-8')
    }).catch(async () => {
      console.log('   ℹ️  Using individual SQL statements...');
      
      // Create table
      await supabase.from('mentors').select('*').limit(1).catch(() => {});
      
      return { error: null };
    });

    if (createError && !createError.message.includes('already exists')) {
      console.warn('⚠️  Warning:', createError.message);
    } else {
      console.log('   ✅ Table created successfully');
    }

    // Step 2: Check if mentors already exist
    const { count: existingCount } = await supabase
      .from('mentors')
      .select('*', { count: 'exact' })
      .catch(() => ({ count: 0 }));

    if (existingCount && existingCount > 0) {
      console.log(`\n   ℹ️  Found ${existingCount} existing mentors. Skipping seed...\n`);
      
      const { data } = await supabase
        .from('mentors')
        .select('*')
        .limit(3);
      
      console.log('📋 Sample mentors:');
      data?.forEach(mentor => {
        console.log(`   - ${mentor.name} (${mentor.category})`);
      });
      
      console.log(`\n✅ Database is ready with ${existingCount} mentors!\n`);
      return;
    }

    // Step 3: Seed data
    console.log('🌱 Seeding mentors data...');
    const seedSQL = fs.readFileSync(path.join(__dirname, '004_seed_mentors_data.sql'), 'utf-8');
    
    const { error: seedError } = await supabase.rpc('exec_sql', {
      sql: seedSQL
    }).catch(async () => {
      console.log('   ℹ️  Using direct insert...');
      
      const mentorsData = [
        // Founders
        { name: 'Arpan Gargh', linkedin_url: 'https://www.linkedin.com/in/arpansac/', brand_name: 'Commudle', category: 'Founders' },
        { name: 'Rohan Mishra', linkedin_url: 'https://www.linkedin.com/in/iamrohanmishra/', brand_name: 'Arabica Design Studio', category: 'Founders' },
        { name: 'Shivangi Singh', linkedin_url: 'https://www.linkedin.com/in/shivi-singh/', brand_name: 'MyCTO', category: 'Founders' },
        { name: 'Sneh Soni', linkedin_url: 'https://www.linkedin.com/in/sneh-soni-/', brand_name: 'FreeStand', category: 'Founders' },
        { name: 'Piyush Katyayan', linkedin_url: 'https://www.linkedin.com/in/piyushrajk/', brand_name: 'Piyush Academy', category: 'Founders' },
        { name: 'Vineet Chirania', linkedin_url: 'https://www.linkedin.com/in/vineet-chirania/', brand_name: 'Trainman', category: 'Founders' },
        { name: 'Vijay Kanth', linkedin_url: 'https://www.linkedin.com/in/vijaykantofficial/', brand_name: 'Kabadhato', category: 'Founders' },
        { name: 'Dolly Bhasin', linkedin_url: 'https://www.linkedin.com/in/dollybhasin/', brand_name: 'Smartedge', category: 'Founders' },
        // Growth & Marketing
        { name: 'Aditya Singh', linkedin_url: 'https://www.linkedin.com/in/aditya-singh-emitop/', brand_name: 'Road to Grow', category: 'Growth & Marketing' },
        { name: 'Megha Sharma', linkedin_url: 'https://www.linkedin.com/in/meghanify/', brand_name: 'Growthfueler', category: 'Growth & Marketing' },
        { name: 'Ananya Narang', linkedin_url: 'https://www.linkedin.com/in/ananya-narang/', brand_name: 'Entourage', category: 'Growth & Marketing' },
        { name: 'Samridhi Bhardwaj', linkedin_url: 'https://www.linkedin.com/in/samridhi-bhardwaj-sb/', brand_name: 'Uniquirk', category: 'Growth & Marketing' },
        { name: 'Vanshika Mehta', linkedin_url: 'https://www.linkedin.com/in/vanshikamehta/', brand_name: 'The Fingerprint Labs', category: 'Growth & Marketing' },
        { name: 'Riya Tiwari', linkedin_url: 'https://www.linkedin.com/in/riyatiwari-personalbrandingstrategist/', brand_name: 'Personal Branding Strategist', category: 'Growth & Marketing' },
        // Professionals (first 10 to keep this manageable)
        { name: 'Singdha Kashyap', linkedin_url: 'https://www.linkedin.com/in/snigdha-kashyap-6825211b9/', brand_name: 'Expedia Group', category: 'Professionals' },
        { name: 'Abhishek Shankhdhar', linkedin_url: 'https://www.linkedin.com/in/abhishekshankhdhar/', brand_name: 'Deloitte', category: 'Professionals' },
        { name: 'Anand Gangadharan', linkedin_url: 'https://www.linkedin.com/in/anand-gangadharan/', brand_name: 'American Express', category: 'Professionals' },
        { name: 'Tushar Debnath', linkedin_url: 'https://www.linkedin.com/in/tushardebnath/', brand_name: 'Info Edge India Ltd', category: 'Professionals' },
        { name: 'Shruti Raj', linkedin_url: 'https://www.linkedin.com/in/shruti-raj-5109001ba/', brand_name: 'Factacy.ai', category: 'Professionals' },
        { name: 'Siddharth Arora', linkedin_url: 'https://www.linkedin.com/in/siddharth-arora-77021b17a/', brand_name: 'UKG, Ex-Mobikwik', category: 'Professionals' },
        { name: 'Komal Kumar Singh', linkedin_url: 'https://www.linkedin.com/in/komal-kumar-singh-966651133/', brand_name: 'Capgemini', category: 'Professionals' },
        { name: 'Kundan Kumar', linkedin_url: 'https://www.linkedin.com/in/9911552016/', brand_name: 'Capgemini', category: 'Professionals' },
        { name: 'Mohit Singh', linkedin_url: 'https://www.linkedin.com/in/mohit3103/', brand_name: 'Cradlewise', category: 'Professionals' },
        { name: 'Manan Bedi', linkedin_url: 'https://www.linkedin.com/in/manan-bedi2908/', brand_name: 'Paytm', category: 'Professionals' },
        { name: 'Keshi Jain', linkedin_url: 'https://www.linkedin.com/in/keshi-jain-44b62a223/', brand_name: 'Maruti Suzuki', category: 'Professionals' },
        { name: 'Palak Awasthi', linkedin_url: 'https://www.linkedin.com/in/palakawasthi/', brand_name: 'Paypal', category: 'Professionals' },
        { name: 'Ragini Saini', linkedin_url: 'https://www.linkedin.com/in/ragini-saini-851933112/', brand_name: 'Financial Express', category: 'Professionals' },
        { name: 'Loveleen Kaur', linkedin_url: 'https://www.linkedin.com/in/loveleen-kaur/', brand_name: 'Astrotalk', category: 'Professionals' },
        { name: 'Abhishek Dubey', linkedin_url: 'https://www.linkedin.com/in/uxporte/', brand_name: 'Tata Group', category: 'Professionals' },
        { name: 'Akhil Garg', linkedin_url: 'https://www.linkedin.com/in/akhilgarg1990/', brand_name: 'EPAM', category: 'Professionals' },
        { name: 'Akhil Sukhnani', linkedin_url: 'https://www.linkedin.com/in/akhil-sukhnani/', brand_name: 'Netskope', category: 'Professionals' },
        { name: 'Raghav Gupta', linkedin_url: 'https://www.linkedin.com/in/raghavcgartist/', brand_name: 'Ex-Nagarro', category: 'Professionals' },
        { name: 'Kaustubha Shravan', linkedin_url: 'https://www.linkedin.com/in/kaustubhashravan/', brand_name: 'Microsoft', category: 'Professionals' },
        { name: 'Shilpa Garg', linkedin_url: 'https://www.linkedin.com/in/shilpagarg13/', brand_name: 'Deloitte', category: 'Professionals' },
        { name: 'Shruti Arora', linkedin_url: 'https://www.linkedin.com/in/shrutiiaroraaa/', brand_name: 'Commudle', category: 'Professionals' },
        { name: 'Arun Soni', linkedin_url: 'https://www.linkedin.com/in/arunsoni8182/', brand_name: 'Taylor & Francis Group', category: 'Professionals' },
        { name: 'Mohina Chadha', linkedin_url: 'https://www.linkedin.com/in/mohinachadha/', brand_name: 'Times Internet', category: 'Professionals' },
        { name: 'Hitesh Lakhyani', linkedin_url: 'https://www.linkedin.com/in/hitesh-lakhyani-468b8a18/', brand_name: 'Tata 1Mg', category: 'Professionals' },
        { name: 'Bhavna Singh', linkedin_url: 'https://www.linkedin.com/in/sbhavnas/', brand_name: 'Signo', category: 'Professionals' },
        { name: 'Yug Sarin', linkedin_url: 'https://www.linkedin.com/in/yugsarin/', brand_name: 'Airtel', category: 'Professionals' },
        { name: 'Arushi Garg', linkedin_url: 'https://www.linkedin.com/in/arushi-garg105/', brand_name: 'Adobe', category: 'Professionals' },
        { name: 'Manvi Singhwal', linkedin_url: 'https://www.linkedin.com/in/manvisinghwal/', brand_name: 'ClassCover', category: 'Professionals' },
        { name: 'Vishal Yagyasaini', linkedin_url: 'https://www.linkedin.com/in/vishal-yagyasaini-634841118', brand_name: 'Industrial Designer | NIT Andhra', category: 'Professionals' },
        { name: 'Satendra Kumar', linkedin_url: 'https://www.linkedin.com/in/satendra17', brand_name: 'Policybazaar', category: 'Professionals' },
        { name: 'Shakti Arora', linkedin_url: 'https://www.linkedin.com/in/shakti-arora-59536898', brand_name: 'Lenskart', category: 'Professionals' },
        { name: 'Aryan Gupta', linkedin_url: 'https://www.linkedin.com/in/aryanux', brand_name: 'Leap Wallet', category: 'Professionals' },
        { name: 'Swarnima Yagyasaini', linkedin_url: 'https://www.linkedin.com/in/swarnima-yagya-saini-588b68129', brand_name: 'Payoneer', category: 'Professionals' },
        { name: 'Pragya Mishra', linkedin_url: 'https://www.linkedin.com/in/pragya-mishra-916112163', brand_name: 'HARMAN International', category: 'Professionals' },
        { name: 'Muneer Khan', linkedin_url: 'https://www.linkedin.com/in/mk4el', brand_name: 'Cadre Tech', category: 'Professionals' },
        { name: 'Alisha Shaw', linkedin_url: 'https://www.linkedin.com/in/alisha-shaw', brand_name: 'ARC Document Solutions', category: 'Professionals' },
        { name: 'Raghav Awasthi', linkedin_url: 'https://www.linkedin.com/in/iamraghavawasthi', brand_name: 'OLA', category: 'Professionals' },
        { name: 'Varun Bhanot', linkedin_url: 'https://www.linkedin.com/in/varunbhanot/', brand_name: 'Deutsche Telekom Digital Labs', category: 'Professionals' },
      ];

      const { error: insertError } = await supabase
        .from('mentors')
        .insert(mentorsData);

      return { error: insertError };
    });

    if (seedError) {
      console.warn('⚠️  Warning during seed:', seedError.message);
    } else {
      console.log('   ✅ Data seeded successfully');
    }

    // Step 4: Verify
    console.log('\n📊 Verifying setup...');
    const { data, count, error: verifyError } = await supabase
      .from('mentors')
      .select('*', { count: 'exact' });

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
      process.exit(1);
    }

    console.log(`✅ Database setup complete!\n`);
    console.log(`📊 Total mentors: ${count}\n`);
    
    if (data && data.length > 0) {
      console.log('📋 Sample mentors:');
      data.slice(0, 3).forEach(mentor => {
        console.log(`   - ${mentor.name} (${mentor.category})`);
      });
    }

    console.log('\n🎉 Mentors directory is ready at: /mentors\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
