/**
 * Classic Love Poems - Rewards for completing experiences
 * Each experience has MULTIPLE poems for variety on replays
 * Randomly selects from available poems each time
 */

export const LOVE_POEMS = {
  'Echo Chamber': [
    // SPECIAL: Her favorite - the first poem you ever sent her
    {
      title: 'Come, And Be My Baby',
      poet: 'Maya Angelou',
      year: '1990',
      text: `The highway is full of big cars going nowhere fast
And folks is smoking anything that'll burn
Some people wrap their lives around a cocktail glass
And you sit wondering
where you're going to turn.
I got it.
Come. And be my baby.

Some prophets say the world is gonna end tomorrow
But others say we've got a week or two
The paper is full of every kind of blooming horror
And you sit wondering
what you're gonna do.
I got it.
Come. And be my baby.`,
      story: 'This is the first poem you ever sent to Mila. Against a backdrop of chaos — big cars going nowhere, apocalyptic prophecies, newspaper horrors — Maya Angelou offers the simple, powerful refuge of love. When the world feels overwhelming and uncertain, the speaker says "I got it. Come. And be my baby." It\'s an invitation to intimate connection as sanctuary from life\'s anxieties, a promise of unconditional acceptance when everything else feels empty and distressing. This poem holds a special place in your story together.',
      isFavorite: true
    },
    {
      title: 'How Do I Love Thee? (Sonnet 43)',
      poet: 'Elizabeth Barrett Browning',
      year: '1850',
      text: `How do I love thee? Let me count the ways.
I love thee to the depth and breadth and height
My soul can reach, when feeling out of sight
For the ends of being and ideal grace.
I love thee to the level of every day's
Most quiet need, by sun and candle-light.
I love thee freely, as men strive for right.
I love thee purely, as they turn from praise.
I love thee with the passion put to use
In my old griefs, and with my childhood's faith.
I love thee with a love I seemed to lose
With my lost saints. I love thee with the breath,
Smiles, tears, of all my life; and, if God choose,
I shall but love thee better after death.`,
      story: 'Written during Elizabeth Barrett\'s courtship with fellow poet Robert Browning, this sonnet is one of the most quoted love poems in English literature. The couple\'s romance was legendary — they eloped to Italy against her father\'s wishes and remained devoted until her death. This poem counts the infinite ways she loves him, from the spiritual to the everyday, promising love that transcends even death.'
    }
  ],

  'Eternal Garden': [
    {
      title: 'A Red, Red Rose',
      poet: 'Robert Burns',
      year: '1794',
      text: `O my Luve is like a red, red rose
That's newly sprung in June;
O my Luve is like the melody
That's sweetly played in tune.

So fair art thou, my bonnie lass,
So deep in luve am I;
And I will luve thee still, my dear,
Till a' the seas gang dry.

Till a' the seas gang dry, my dear,
And the rocks melt wi' the sun;
I will love thee still, my dear,
While the sands o' life shall run.

And fare thee weel, my only luve!
And fare thee weel awhile!
And I will come again, my luve,
Though it were ten thousand mile.`,
      story: 'Scotland\'s national poet Robert Burns wrote this in 1794, and it remains one of the most beloved love songs ever written. Using simple but powerful imagery — a rose, a melody, the seas, the sun — Burns makes extravagant promises of eternal devotion. The poem captures the passionate, overwhelming feeling of being completely in love, willing to traverse any distance and wait any length of time.'
    },
    {
      title: 'Love\'s Philosophy',
      poet: 'Percy Bysshe Shelley',
      year: '1819',
      text: `The fountains mingle with the river
And the rivers with the ocean,
The winds of heaven mix for ever
With a sweet emotion;
Nothing in the world is single;
All things by a law divine
In one spirit meet and mingle.
Why not I with thine?—

See the mountains kiss high heaven
And the waves clasp one another;
No sister-flower would be forgiven
If it disdained its brother;
And the sunlight clasps the earth
And the moonbeams kiss the sea:
What is all this sweet work worth
If thou kiss not me?`,
      story: 'Shelley uses nature as an argument for love — if fountains mingle with rivers, if mountains kiss the sky, if moonbeams kiss the sea, why shouldn\'t lovers unite? It\'s playful, seductive, and uses the natural world to show that connection and unity are fundamental laws of existence.'
    }
  ],

  'Reflections': [
    {
      title: 'When You Are Old',
      poet: 'William Butler Yeats',
      year: '1893',
      text: `When you are old and grey and full of sleep,
And nodding by the fire, take down this book,
And slowly read, and dream of the soft look
Your eyes had once, and of their shadows deep;

How many loved your moments of glad grace,
And loved your beauty with love false or true,
But one man loved the pilgrim soul in you,
And loved the sorrows of your changing face;

And bending down beside the glowing bars,
Murmur, a little sadly, how Love fled
And paced upon the mountains overhead
And hid his face amid a crowd of stars.`,
      story: 'Yeats wrote this for Maud Gonne, an Irish revolutionary he loved for decades but who never fully returned his affection. The poem looks forward to her old age, when she might finally understand that while many loved her beauty, he alone loved her true inner self — her "pilgrim soul." It\'s a bittersweet meditation on unrequited love and the hope that someday, she would recognize the depth of his devotion.'
    },
    {
      title: 'To My Dear and Loving Husband',
      poet: 'Anne Bradstreet',
      year: '1678',
      text: `If ever two were one, then surely we.
If ever man were loved by wife, then thee.
If ever wife was happy in a man,
Compare with me, ye women, if you can.
I prize thy love more than whole mines of gold,
Or all the riches that the East doth hold.
My love is such that rivers cannot quench,
Nor ought but love from thee give recompense.
Thy love is such I can no way repay;
The heavens reward thee manifold, I pray.
Then while we live, in love let's so persevere,
That when we live no more, we may live ever.`,
      story: 'Anne Bradstreet was one of the first poets in colonial America. This tender poem expresses the deep unity and mutual love she shared with her husband Simon. Writing in an era when women\'s voices were rarely heard, she boldly declares her love is worth more than gold or riches. It\'s a celebration of marriage as true partnership and eternal bond.'
    }
  ],

  'Choreographer': [
    {
      title: 'She Walks in Beauty',
      poet: 'Lord Byron',
      year: '1814',
      text: `She walks in beauty, like the night
Of cloudless climes and starry skies;
And all that's best of dark and bright
Meet in her aspect and her eyes;
Thus mellowed to that tender light
Which heaven to gaudy day denies.

One shade the more, one ray the less,
Had half impaired the nameless grace
Which waves in every raven tress,
Or softly lightens o'er her face;
Where thoughts serenely sweet express,
How pure, how dear their dwelling-place.

And on that cheek, and o'er that brow,
So soft, so calm, yet eloquent,
The smiles that win, the tints that glow,
But tell of days in goodness spent,
A mind at peace with all below,
A heart whose love is innocent!`,
      story: 'Byron wrote this after encountering his cousin by marriage, Mrs. Wilmot, at a party where she wore a black mourning dress brightened with spangles. Struck by her beauty, he penned these lines that same night. The poem celebrates both outer beauty and inner grace — the way physical loveliness reflects a peaceful mind and innocent heart. It remains one of the most musical celebrations of beauty ever written.'
    }
  ],

  'Gallery of Us': [
    {
      title: 'Sonnet 18',
      poet: 'William Shakespeare',
      year: '1609',
      text: `Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date;
Sometime too hot the eye of heaven shines,
And often is his gold complexion dimmed;
And every fair from fair sometime declines,
By chance or nature's changing course untrimmed;
But thy eternal summer shall not fade,
Nor lose possession of that fair thou ow'st;
Nor shall death brag thou wander'st in his shade,
When in eternal lines to time thou grow'st:
   So long as men can breathe or eyes can see,
   So long lives this, and this gives life to thee.`,
      story: 'Perhaps the most famous love poem ever written, Shakespeare\'s Sonnet 18 promises the beloved immortality through poetry. While summer fades and beauty declines with time, the beloved\'s perfection will live forever in these verses. As long as people read these words — centuries later — the beloved remains eternally young and beautiful. It\'s the ultimate promise: love that defeats death through art.'
    }
  ],

  'The Dialogue': [
    {
      title: 'Annabel Lee',
      poet: 'Edgar Allan Poe',
      year: '1849',
      text: `It was many and many a year ago,
   In a kingdom by the sea,
That a maiden there lived whom you may know
   By the name of Annabel Lee;
And this maiden she lived with no other thought
   Than to love and be loved by me.

I was a child and she was a child,
   In this kingdom by the sea,
But we loved with a love that was more than love—
   I and my Annabel Lee—
With a love that the winged seraphs of Heaven
   Coveted her and me.

And this was the reason that, long ago,
   In this kingdom by the sea,
A wind blew out of a cloud, chilling
   My beautiful Annabel Lee;
So that her highborn kinsmen came
   And bore her away from me,
To shut her up in a sepulchre
   In this kingdom by the sea.

The angels, not half so happy in Heaven,
   Went envying her and me—
Yes!—that was the reason (as all men know,
   In this kingdom by the sea)
That the wind came out of the cloud by night,
   Chilling and killing my Annabel Lee.

But our love it was stronger by far than the love
   Of those who were older than we—
   Of many far wiser than we—
And neither the angels in Heaven above
   Nor the demons down under the sea
Can ever dissever my soul from the soul
   Of the beautiful Annabel Lee;

For the moon never beams, without bringing me dreams
   Of the beautiful Annabel Lee;
And the stars never rise, but I feel the bright eyes
   Of the beautiful Annabel Lee;
And so, all the night-tide, I lie down by the side
   Of my darling—my darling—my life and my bride,
   In her sepulchre there by the sea—
   In her tomb by the sounding sea.`,
      story: 'Poe\'s haunting masterpiece about a childhood love lost to death. Written shortly before his own death, many believe it was inspired by his young wife Virginia, who died of tuberculosis. The poem\'s hypnotic rhythm and repetition mirror obsessive grief and devotion that persists beyond the grave. Despite envious angels and the separation of death, the speaker\'s love remains unbroken — a testament to love\'s power to transcend mortality.'
    }
  ],

  'Constellation You': [
    {
      title: 'Bright Star',
      poet: 'John Keats',
      year: '1819',
      text: `Bright star, would I were stedfast as thou art—
   Not in lone splendour hung aloft the night
And watching, with eternal lids apart,
   Like nature's patient, sleepless Eremite,
The moving waters at their priestlike task
   Of pure ablution round earth's human shores,
Or gazing on the new soft-fallen mask
   Of snow upon the mountains and the moors—
No—yet still stedfast, still unchangeable,
   Pillow'd upon my fair love's ripening breast,
To feel for ever its soft fall and swell,
   Awake for ever in a sweet unrest,
Still, still to hear her tender-taken breath,
And so live ever—or else swoon to death.`,
      story: 'Keats wrote this sonnet for Fanny Brawne, whom he loved passionately but could never marry due to his poverty and failing health. He died of tuberculosis at 25, just months after writing this. The poem wishes for the constancy of a star, but not its loneliness — instead, he wants to remain forever on his beloved\'s breast, feeling her breathing. It\'s an intensely physical, sensual vision of eternal love, made heartbreaking by his early death.'
    }
  ],

  'Mirror of Moments': [
    {
      title: 'The First Day',
      poet: 'Christina Rossetti',
      year: '1862',
      text: `I wish I could remember that first day,
First hour, first moment of your meeting me,
If bright or dim the season, it might be
Summer or Winter for aught I can say;
So unrecorded did it slip away,
So blind was I to see and to foresee,
So dull to mark the budding of my tree
That would not blossom yet for many a May.
If only I could recollect it, such
A day of days! I let it come and go
As traceless as a thaw of bygone snow;
It seemed to mean so little, meant so much;
If only now I could recall that touch,
First touch of hand in hand—Did one but know!`,
      story: 'Christina Rossetti, one of the Victorian era\'s greatest poets, captures the bittersweet realization that we never know which moments will change our lives. She wishes she could remember the exact moment she met her love — what seemed ordinary then now seems precious beyond measure. It\'s a poem about memory, regret, and the way love transforms past moments into treasures we wish we\'d savored more carefully.'
    }
  ],

  'Grace': [
    {
      title: 'He Wishes for the Cloths of Heaven',
      poet: 'William Butler Yeats',
      year: '1899',
      text: `Had I the heavens' embroidered cloths,
Enwrought with golden and silver light,
The blue and the dim and the dark cloths
Of night and light and the half-light,
I would spread the cloths under your feet:
But I, being poor, have only my dreams;
I have spread my dreams under your feet;
Tread softly because you tread on my dreams.`,
      story: 'Another poem Yeats wrote for Maud Gonne, this one expresses the vulnerability of offering your dreams to someone you love. If he were rich, he would give her the heavens themselves — but being poor, all he can offer are his dreams. The final line, "Tread softly because you tread on my dreams," is one of the most quoted in poetry, capturing how love makes us fragile and brave at once.'
    }
  ],

  'Stage Light': [
    {
      title: 'The Name',
      poet: 'Pablo Neruda',
      year: '1959',
      text: `I want to say your name,
the way the rain says the flowers,
the way the wind says the leaves.
I want to say it
the way the earth says the seed,
the way the fire says the wood.

Your name is a torch in my mouth.
Your name is a key that opens doors.
Your name is the sound of my heart
when it remembers how to sing.`,
      story: 'Pablo Neruda was a master of love poetry. This poem celebrates the power of a beloved\'s name — how speaking it connects us to the natural world, to elemental forces like rain, wind, earth, and fire. A name becomes more than letters; it\'s a torch that lights the way, a key that unlocks everything, the music that makes the heart remember joy. Your name, Mila (Milagros — miracles), carries all of this and more.'
    },
    {
      title: 'She Walks in Beauty',
      poet: 'Lord Byron',
      year: '1814',
      text: `She walks in beauty, like the night
Of cloudless climes and starry skies;
And all that's best of dark and bright
Meet in her aspect and her eyes;
Thus mellowed to that tender light
Which heaven to gaudy day denies.

One shade the more, one ray the less,
Had half impaired the nameless grace
Which waves in every raven tress,
Or softly lightens o'er her face;
Where thoughts serenely sweet express,
How pure, how dear their dwelling-place.

And on that cheek, and o'er that brow,
So soft, so calm, yet eloquent,
The smiles that win, the tints that glow,
But tell of days in goodness spent,
A mind at peace with all below,
A heart whose love is innocent!`,
      story: 'Lord Byron wrote this poem the morning after meeting his cousin\'s wife at a ball, struck by her beauty and grace. She was wearing a black mourning dress with spangled decorations, creating a stunning contrast of light and dark. The poem celebrates how beauty isn\'t just physical — it\'s the meeting of inner goodness and outer grace, darkness and light in perfect balance. Like a name that means "miracles," true beauty is something that illuminates everything around it.'
    }
  ],

  'Monuments of Love': [
    {
      title: 'Sonnet 116',
      poet: 'William Shakespeare',
      year: '1609',
      text: `Let me not to the marriage of true minds
Admit impediments. Love is not love
Which alters when it alteration finds,
Or bends with the remover to remove.
O no! it is an ever-fixed mark
That looks on tempests and is never shaken;
It is the star to every wand'ring bark,
Whose worth's unknown, although his height be taken.
Love's not Time's fool, though rosy lips and cheeks
Within his bending sickle's compass come;
Love alters not with his brief hours and weeks,
But bears it out even to the edge of doom.
   If this be error and upon me proved,
   I never writ, nor no man ever loved.`,
      story: 'This is Shakespeare\'s definition of true love — constant, unchanging, unshakeable. It\'s the "ever-fixed mark" that guides us like the North Star guides ships. Real love doesn\'t fade with time or physical changes. It endures everything, even death ("the edge of doom"). Shakespeare ends with absolute certainty: if he\'s wrong about this, then he never wrote anything, and no one ever truly loved. It\'s the perfect finale — a promise that real love is eternal.'
    }
  ]
};

/**
 * Get a poem for an experience
 * Returns the next unseen poem, or a random one if all have been seen
 */
export function getPoemForExperience(experienceName) {
  const poemsArray = LOVE_POEMS[experienceName];
  if (!poemsArray || poemsArray.length === 0) return null;

  // Get seen poems for this experience
  const seenKey = `mila:seen-poems:${experienceName}`;
  const seenIndices = JSON.parse(localStorage.getItem(seenKey) || '[]');

  // Find first unseen poem
  for (let i = 0; i < poemsArray.length; i++) {
    if (!seenIndices.includes(i)) {
      return { poem: poemsArray[i], index: i };
    }
  }

  // All seen - reset and return first poem
  localStorage.setItem(seenKey, JSON.stringify([]));
  return { poem: poemsArray[0], index: 0 };
}

/**
 * Mark poem as seen
 */
export function markPoemAsSeen(experienceName, poemIndex) {
  const seenKey = `mila:seen-poems:${experienceName}`;
  const seenIndices = JSON.parse(localStorage.getItem(seenKey) || '[]');

  if (!seenIndices.includes(poemIndex)) {
    seenIndices.push(poemIndex);
    localStorage.setItem(seenKey, JSON.stringify(seenIndices));
  }
}
