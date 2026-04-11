// ============================================================
// Few-shot examples injected into generation prompts.
// - GOLD_STANDARD_PAGE_EXAMPLE_EN: universal English example (structural)
// - GOLD_STANDARD_PAGE_EXAMPLE_KA: Georgian example (language quality)
// - GEORGIAN_LANGUAGE_GUIDE: native-Georgian fluency rules
//
// The active example is selected at call time based on target language.
// Georgian courses get the Georgian example so Gemini sees native
// Georgian output as the "gold standard" to imitate.
//
// ⚠️  REVIEW REQUIRED — GOLD_STANDARD_PAGE_EXAMPLE_KA below was drafted
//     by a non-native speaker. Every string must be reviewed by a native
//     Georgian speaker before this ships. Any awkward phrasing or
//     grammar errors here will be learned and reproduced by Gemini in
//     every future lesson. Fix it in place, then remove this warning.
// ============================================================

export const GOLD_STANDARD_PAGE_EXAMPLE_EN = `EXAMPLE OF A GOLD-STANDARD PAGE — study the structure, block variety, and content depth. Adapt the wording and topic to whatever you are teaching; preserve this level of quality.

{
  "page_number": 2,
  "title": "How Variables Hold Data",
  "content_blocks": [
    { "type": "heading", "content": "Storing Values in Variables" },
    { "type": "text", "content": "On the previous page you learned **what** a variable is. Now we will see how a variable actually holds data and how that data can change as a program runs." },
    { "type": "definition", "content": "A value is the specific piece of data currently stored inside a variable — a number, a word, a true/false flag, or a more complex object.", "metadata": { "term": "Value" } },
    { "type": "example", "content": "Suppose we write:\\n\\n\`score = 0\`\\n\\nThe variable \`score\` now holds the value \`0\`. Later, if the player scores 10 points, we update it:\\n\\n\`score = score + 10\`\\n\\nNow \`score\` holds \`10\`. The same name points to a new value.", "metadata": { "title": "A running game score" } },
    { "type": "analogy", "content": "Think of a variable as a labeled jar on a shelf. The label (the name) never changes, but what is inside the jar (the value) can be swapped out whenever you want." },
    { "type": "step_by_step", "content": "How to update a variable in any language", "metadata": { "steps": ["Read the current value from the variable", "Combine it with new data using an operation", "Assign the result back to the same variable"] } },
    { "type": "warning", "content": "Common mistake: in most languages \`=\` means 'store this value here', not 'is mathematically equal to'. The line \`score = score + 10\` is an instruction, not an equation." },
    { "type": "summary", "content": "Variables give names to values, and those values can change while the program runs. Updating a variable means computing something new and storing it back under the same name." }
  ],
  "key_concepts": [
    { "term": "Value", "definition": "The specific data stored inside a variable at any moment" },
    { "term": "Assignment", "definition": "Storing a new value into a variable using the = operator" }
  ],
  "teaching_flow": {
    "reflection_prompt": "If you had to explain to a friend in one sentence what happens when the computer runs \`x = x + 1\`, how would you put it?"
  },
  "difficulty_level": "foundational",
  "bridge_from_previous": "You just met the concept of a variable. Now let us see how a variable's content can actually change while a program is running.",
  "common_misconceptions": [
    "Students often read \`=\` as mathematical equality when in code it means 'store this value here'",
    "Students assume a variable's value is permanent once set — it can be reassigned at any time"
  ],
  "real_world_applications": [
    "Tracking a player's score, health, or lives in a game",
    "Remembering a user's name and preferences in an app",
    "Holding the running total while a cashier rings up items at checkout"
  ],
  "check_questions": [
    {
      "question": "After running \`count = 3\` and then \`count = count + 2\`, what value does \`count\` hold?",
      "type": "mcq",
      "options": ["2", "3", "5", "32"],
      "correct_answer": "5",
      "explanation": "The second line reads the current value (3), adds 2, and stores the result (5) back in count.",
      "difficulty": "easy",
      "points": 5
    },
    {
      "question": "In most programming languages, \`score = score + 10\` means 'store the new value (score + 10) back into score'.",
      "type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "The = sign is the assignment operator — it stores whatever is on the right into the variable on the left.",
      "difficulty": "easy",
      "points": 5
    },
    {
      "question": "The ___ operator is used to store a value into a variable.",
      "type": "fill_in_blank",
      "correct_answer": "=",
      "explanation": "The equals sign (=) is the assignment operator in most programming languages.",
      "difficulty": "medium",
      "points": 5
    }
  ]
}

Notice: six DIFFERENT block types on one page, concrete examples with real code, a concrete analogy, specific misconceptions, specific real-world uses, and three check questions of two different types. Match this density and specificity in the pages you generate.`;

// ============================================================
// Georgian example — REVIEW REQUIRED (see warning at top of file)
// ============================================================

export const GOLD_STANDARD_PAGE_EXAMPLE_KA = `მაგალითი იდეალური გაკვეთილის გვერდისა — გაითვალისწინე სტრუქტურა, ბლოკების მრავალფეროვნება და შინაარსის სიღრმე. მიუდგი შენი ქართული გვერდები იგივე ხარისხით: ყოველი წინადადება უნდა ჟღერდეს როგორც ქართველი პედაგოგის ნაწერი, არა თარგმანი.

{
  "page_number": 1,
  "title": "რა არის Prompt და რატომ არის ის მნიშვნელოვანი",
  "content_blocks": [
    { "type": "heading", "content": "Prompt-ის არსი" },
    { "type": "text", "content": "Prompt არის ინსტრუქცია, რომელსაც შენ AI მოდელს აძლევ. ეს არის შენი ხმა, რომლითაც მოდელს ეუბნები რა გინდა, როგორ გინდა და რა ფორმით გინდა. რაც უფრო ზუსტი და კონკრეტულია შენი Prompt, მით უფრო ზუსტ შედეგს მიიღებ." },
    { "type": "definition", "content": "Prompt არის ტექსტური ინსტრუქცია, რომელიც AI მოდელს აძლევს კონკრეტულ დავალებას — რა უნდა გააკეთოს, რა სტილში და რა ფორმატით.", "metadata": { "term": "Prompt" } },
    { "type": "example", "content": "ცუდი Prompt:\\n\\n*'დაწერე Instagram პოსტი'*\\n\\nშედეგი იქნება ზოგადი და გამოუყენებელი.\\n\\nკარგი Prompt:\\n\\n*'შენ ხარ გამოცდილი SMM სპეციალისტი. დაწერე Instagram პოსტი ახალი ქართული ყავის ბრენდისთვის. ტონი: მეგობრული და თბილი. სიგრძე: 3 წინადადება. მიზანი: ხალხი დაინტერესდეს და ჰკითხოს ფასი კომენტარებში.'*\\n\\nეს არის კარგი Prompt, რადგან მოიცავს როლს, კონტექსტს, კონკრეტულ დავალებას, ტონს და მიზანს.", "metadata": { "title": "ცუდი vs კარგი Prompt" } },
    { "type": "analogy", "content": "წარმოიდგინე, რომ AI არის გამოცდილი თანაშემწე, რომელიც პირველ დღეს მოვიდა შენს ოფისში. მან ყველაფერი იცის მარკეტინგის შესახებ, მაგრამ შენი ბრენდის შესახებ არაფერი. Prompt არის შენი ინსტრუქცია ამ თანაშემწისთვის — რაც უფრო ნათლად აუხსნი რა გინდა, მით უფრო კარგად გაგიკეთებს დავალებას." },
    { "type": "step_by_step", "content": "კარგი Prompt-ის აგების 4 ნაბიჯი", "metadata": { "steps": ["როლი: უთხარი AI-ს ვინ არის იგი (მაგ: 'შენ ხარ გამოცდილი მარკეტოლოგი')", "კონტექსტი: მიეცი ფონური ინფორმაცია (პროდუქტი, ბრენდი, აუდიტორია)", "დავალება: დაწერე ზუსტად რა გინდა (მოკლე, კონკრეტული ზმნით)", "ფორმატი და ტონი: მიუთითე სიგრძე, სტილი და ფორმა (მაგ: '3 წინადადება, მეგობრული ტონით')"] } },
    { "type": "warning", "content": "ყველაზე ხშირი შეცდომა: ხალხი ფიქრობს, რომ საკმარისია დაწერო 'რამე მარკეტინგული'. ეს არ არის Prompt — ეს არის სურვილი. AI არ არის მკითხაობა. ის ზუსტად იმას გააკეთებს, რასაც მას დაავალებ — ამიტომაც ცუდი Prompt ცუდ შედეგს იძლევა." },
    { "type": "tip", "content": "პროფესიული რჩევა: სანამ Prompt-ს დაწერ, ჯერ საკუთარ თავს ჰკითხე — 'ეს დავალება რომ ახალ თანამშრომელს მივცე, რა ინფორმაცია დასჭირდება?' ყველა ეს ინფორმაცია უნდა იყოს შენს Prompt-ში." },
    { "type": "summary", "content": "Prompt არის შენი კომუნიკაციის ხელსაწყო AI-სთან. კარგი Prompt მოიცავს როლს, კონტექსტს, კონკრეტულ დავალებას, ფორმატსა და ტონს. რაც უფრო ზუსტი ხარ, მით უფრო კარგ შედეგს მიიღებ." }
  ],
  "key_concepts": [
    { "term": "Prompt", "definition": "ტექსტური ინსტრუქცია, რომელიც AI მოდელს აძლევს კონკრეტულ დავალებას" },
    { "term": "კონტექსტი", "definition": "ფონური ინფორმაცია, რომელიც AI-ს ეხმარება უკეთ გაიგოს შენი დავალების მიზანი" }
  ],
  "teaching_flow": {
    "reflection_prompt": "იფიქრე შენს ყოველდღიურ სამუშაოზე — რომელი დავალებაა ყველაზე მარტივი, რომ AI-ს გადააბარო? სცადე მისი გაკეთება კარგი Prompt-ით, 4-ნაბიჯიანი სტრუქტურის გამოყენებით."
  },
  "difficulty_level": "foundational",
  "bridge_from_previous": null,
  "common_misconceptions": [
    "'რაც უფრო მოკლეა Prompt, მით უკეთესი' — არასწორი. მოკლე Prompt ხშირად ზოგად და გამოუყენებელ პასუხს იძლევა.",
    "'AI თვითონ მიხვდება რა მინდა' — არა. AI მხოლოდ იმას გაანალიზებს, რასაც მას მიწერ. კონტექსტი უნდა იყოს ნათელი."
  ],
  "real_world_applications": [
    "Instagram და Facebook პოსტების შექმნა კონკრეტული ბრენდის ხმით",
    "Email-ების წერა კლიენტებისთვის — newsletter-ები, გაყიდვების კამპანიები",
    "სარეკლამო ტექსტების მომზადება Facebook Ads-სა და Google Ads-ისთვის",
    "კონტენტ გეგმების შედგენა — კვირის ან თვის სოციალური მედიის კალენდარი"
  ],
  "check_questions": [
    {
      "question": "რა არის Prompt?",
      "type": "mcq",
      "options": [
        "AI მოდელის სახელი",
        "ტექსტური ინსტრუქცია, რომელსაც AI მოდელს ვაძლევთ კონკრეტული დავალების მისაცემად",
        "AI-ის პასუხი კითხვაზე",
        "პროგრამირების ენა AI-სთვის"
      ],
      "correct_answer": "ტექსტური ინსტრუქცია, რომელსაც AI მოდელს ვაძლევთ კონკრეტული დავალების მისაცემად",
      "explanation": "Prompt არის ის ინსტრუქცია, რომელსაც ვწერთ AI მოდელს — ზუსტად ვეუბნებით რა, როგორ და რა ფორმით გვინდა.",
      "difficulty": "easy",
      "points": 5
    },
    {
      "question": "კარგი Prompt ყოველთვის მოიცავს როლს, კონტექსტს, დავალებასა და ფორმატს.",
      "type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "4-ნაბიჯიანი სტრუქტურა — როლი, კონტექსტი, დავალება, ფორმატი — არის საფუძველი ყველა კარგი Prompt-ისა.",
      "difficulty": "easy",
      "points": 5
    },
    {
      "question": "________ არის ფონური ინფორმაცია, რომელიც AI-ს ეხმარება უკეთ გაიგოს შენი დავალების მიზანი.",
      "type": "fill_in_blank",
      "correct_answer": "კონტექსტი",
      "explanation": "კონტექსტი არის ის ფონი — ბრენდი, აუდიტორია, მიზანი — რომელიც AI-ს ეხმარება უფრო ზუსტი პასუხი მოგცეს.",
      "difficulty": "medium",
      "points": 5
    }
  ]
}

შეამჩნიე: ერთ გვერდზე არის რვა სხვადასხვა ტიპის content_block, კონკრეტული ქართული მაგალითი (ყავის ბრენდი, SMM სცენარი), კულტურულად ნაცნობი ანალოგია (ახალი თანაშემწე ოფისში), სპეციფიკური შეცდომები და სამი სხვადასხვა ტიპის კითხვა. გაუმეორე იგივე სიღრმე და სპეციფიკურობა შენს გვერდებში.`;

export const GEORGIAN_LANGUAGE_GUIDE = `LANGUAGE QUALITY — WHEN WRITING IN GEORGIAN (ქართული):
- Write in native, grammatical Georgian. Never produce literal word-for-word translations from English — sentences must sound like a Georgian educator wrote them from scratch.
- Register: warm, friendly, and respectful. Not overly academic, not street-slang.
- Technical terms (prompt, AI, machine learning, dataset, etc.) may stay in English when there is no clean Georgian equivalent, but introduce each term with a short Georgian explanation the first time it appears.
- Use proper Georgian punctuation and sentence structure. Avoid awkward syntax that looks like machine translation.
- Choose examples and analogies that feel natural to a Georgian audience where possible.
- Every field in the JSON — including titles, definitions, explanations, questions, options, and reflection prompts — must be in Georgian when Georgian is the target language. Never mix languages within a single field unless the mix is intentional (e.g. quoting an English technical term).`;
