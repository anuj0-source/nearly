export const interests = [
    { id: "gaming", label: "Gaming", icon: "🎮" },
    { id: "coding", label: "Coding", icon: "</>" },
    { id: "music", label: "Music", icon: "♪" },
    { id: "movies", label: "Movies", icon: "🎬" },
    { id: "anime", label: "Anime", icon: "✦" },
    { id: "memes", label: "Memes", icon: "😏" },
    { id: "sports", label: "Sports", icon: "🏀" },
    { id: "art", label: "Art", icon: "�" },
    { id: "travel", label: "Travel", icon: "✈" },
    { id: "books", label: "Books", icon: "📖" },
    { id: "fitness", label: "Fitness", icon: "⚡" },
    { id: "technology", label: "Technology", icon: "◍" },
];

export const anonymousPeople = [
    {
        id: "fox",
        name: "Anonymous Fox",
        avatar: "fox",
        distance: "800m away",
        status: "online",
        description: "Looking for someone to talk to",
        interests: ["Gaming", "Music"],
    },
    {
        id: "panda",
        name: "Anonymous Panda",
        avatar: "panda",
        distance: "1.2 km away",
        status: "online",
        description: "Probably thinking about food",
        interests: ["Coding", "Movies"],
    },
    {
        id: "ghost",
        name: "Anonymous Ghost",
        avatar: "ghost",
        distance: "1.8 km away",
        status: "away",
        description: "Quietly looking around campus",
        interests: ["Anime", "Books"],
    },
    {
        id: "owl",
        name: "Anonymous Owl",
        avatar: "owl",
        distance: "2.1 km away",
        status: "online",
        description: "Late-night conversation enthusiast",
        interests: ["Art", "Technology"],
    },
];

export const previousMatches = [
    {
        ...anonymousPeople[0],
        lastMessage: "Had a surprisingly deep conversation.",
        time: "2h ago",
        status: "online",
    },
    {
        ...anonymousPeople[1],
        lastMessage: "Talked about college life.",
        time: "Yesterday",
        status: "online",
    },
    {
        ...anonymousPeople[2],
        lastMessage: "Gaming + coding. A solid combo.",
        time: "2 days ago",
        status: "online",
    },
];

export const starterMessages = [
    {
        id: "welcome",
        sender: "them",
        text: "Hey! What brought you to Nearly?",
        time: "10:24 PM",
    },
];
