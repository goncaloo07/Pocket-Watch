const fs = require("fs");
const path = require("path");
const REPO_OWNER = "goncaloo07";
const REPO_NAME = "Pocket-Watch";
const SITE_URL = "https://pocket-watch-murex.vercel.app";
const PAGES = [
    { path: "/", file: "html/pages/home.html", priority: "1.0", changefreq: "weekly" },
    { path: "/balance", file: "html/pages/balance.html", priority: "0.8", changefreq: "weekly" },
];

// asks the GitHub API for the last commit date that touched a given file
const getLastCommitDate = async (filePath) => {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${filePath}&per_page=1`;
    try {
        const response = await fetch(url, {
            headers: { "Accept": "application/vnd.github+json" }
        });
        if (!response.ok) {
            throw new Error(`GitHub API returned ${response.status}`);
        }
        const commits = await response.json();
        if (commits.length === 0) {
            throw new Error(`No commits found for ${filePath}`);
        }
        // the date comes as a full timestamp like "2026-09-05T14:32:10Z"
        const fullDate = commits[0].commit.committer.date;
        return fullDate.split("T")[0];
    } catch (error) {
        // if anything goes wrong (API down, rate limit, network issue), fall back to today's date instead of crashing the whole build
        console.error(`Could not get last commit date for ${filePath}:`, error.message);
        return new Date().toISOString().split("T")[0];
    }
};

// builds the <url> block for a single page
const buildUrlEntry = (page, lastmod) => {
    return `    <url>
        <loc>${SITE_URL}${page.path}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`;
};

// builds the full sitemap.xml content, fetching the lastmod date for every page first
const buildSitemap = async () => {
    const entries = await Promise.all(
        PAGES.map(async (page) => {
            const lastmod = await getLastCommitDate(page.file);
            return buildUrlEntry(page, lastmod);
        })
    );
    return `<?xml version="1.0" encoding="UTF-8"?>
                <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                ${entries.join("\n")}
                </urlset>
            `;
};

// builds the sitemap content, then saves it to disk
const run = async () => {
    console.log("Generating sitemap.xml...");
    const sitemapContent = await buildSitemap();
    // __dirname is the folder this script lives in (scripts/).
    // ".." goes up one level to the project root, where sitemap.xml should live
    const outputPath = path.join(__dirname, "..", "sitemap.xml");
    fs.writeFileSync(outputPath, sitemapContent);
    console.log(`sitemap.xml written to ${outputPath}`);
};

run();