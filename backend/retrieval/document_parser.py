"""
Document parser for VeriCorp Markdown policy files.
Extracts YAML frontmatter and parses bullet points into Evidence chunks.
"""

from pathlib import Path
from typing import Optional, Union
import yaml
from pydantic import BaseModel, Field

from backend.contracts import Evidence


class PolicyMetadata(BaseModel):
    """Metadata extracted from a policy document's YAML frontmatter."""
    name: str
    title: Optional[str] = None
    version: str = "v1"
    effective_date: Optional[str] = None


class PolicyDocument(BaseModel):
    """Parsed policy document containing metadata and Evidence chunks."""
    metadata: PolicyMetadata
    source: str
    chunks: list[Evidence] = Field(default_factory=list)


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """
    Splits YAML frontmatter from Markdown body.
    Expects frontmatter enclosed in '---' markers at the start of the file.

    Returns:
        tuple[dict, str]: (parsed_yaml_dict, body_text)
    """
    content = content.lstrip()
    if not content.startswith("---"):
        return {}, content

    parts = content.split("---", 2)
    if len(parts) < 3:
        raise ValueError("Malformed frontmatter: missing closing '---'")

    raw_yaml = parts[1]
    body = parts[2].strip()

    parsed = yaml.safe_load(raw_yaml)
    if not isinstance(parsed, dict):
        parsed = {}

    return parsed, body


def extract_bullet_chunks(body: str) -> list[str]:
    """
    Extracts bullet points from Markdown body text.
    Each bullet starting with '- ' or '* ' becomes one chunk.
    Multi-line bullets (indented lines under a bullet) are joined.

    Returns:
        list[str]: Clean list of bullet texts.
    """
    chunks: list[str] = []
    current_lines: list[str] = []

    for line in body.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        # Check if line starts a new bullet
        if stripped.startswith("- ") or stripped.startswith("* "):
            if current_lines:
                chunks.append(" ".join(current_lines))
                current_lines = []
            bullet_text = stripped[2:].strip()
            if bullet_text:
                current_lines.append(bullet_text)
        elif current_lines and (line.startswith("  ") or line.startswith("\t")):
            # Continuation of previous bullet
            current_lines.append(stripped)

    if current_lines:
        chunks.append(" ".join(current_lines))

    return chunks


def parse_policy_text(text: str, filename: str) -> PolicyDocument:
    """
    Parses raw policy file text into a PolicyDocument with Evidence chunks.

    Args:
        text: Raw file content with frontmatter and markdown body.
        filename: Name of the policy file (e.g., 'refund_policy.md').

    Returns:
        PolicyDocument containing metadata and Evidence chunks.
    """
    frontmatter_dict, body = parse_frontmatter(text)

    name = str(frontmatter_dict.get("name", Path(filename).stem))
    title = frontmatter_dict.get("title")
    version = str(frontmatter_dict.get("version", "v1"))
    effective_date = frontmatter_dict.get("effective_date")
    if effective_date is not None:
        effective_date = str(effective_date)

    metadata = PolicyMetadata(
        name=name,
        title=title,
        version=version,
        effective_date=effective_date
    )

    bullets = extract_bullet_chunks(body)

    chunks: list[Evidence] = []
    for idx, bullet_text in enumerate(bullets, start=1):
        chunk_id = f"{filename}#{idx}"
        chunks.append(
            Evidence(
                source=filename,
                version=version,
                text=bullet_text,
                chunk_id=chunk_id
            )
        )

    return PolicyDocument(
        metadata=metadata,
        source=filename,
        chunks=chunks
    )


def parse_policy_file(file_path: Union[str, Path]) -> PolicyDocument:
    """
    Reads and parses a single .md policy file.

    Args:
        file_path: Path to the .md file.

    Returns:
        PolicyDocument with extracted metadata and Evidence chunks.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Policy file not found: {path}")

    text = path.read_text(encoding="utf-8")
    return parse_policy_text(text, filename=path.name)


def load_all_policies(policies_dir: Union[str, Path] = "data/policies") -> list[PolicyDocument]:
    """
    Discovers and parses all .md files in the policies directory.

    Args:
        policies_dir: Directory containing policy Markdown files.

    Returns:
        list[PolicyDocument]: List of parsed policy documents.
    """
    dir_path = Path(policies_dir)
    if not dir_path.exists() or not dir_path.is_dir():
        raise FileNotFoundError(f"Policies directory not found: {dir_path}")

    documents: list[PolicyDocument] = []
    # Sort files for deterministic ordering
    for file_path in sorted(dir_path.glob("*.md")):
        doc = parse_policy_file(file_path)
        documents.append(doc)

    return documents
