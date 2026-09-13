import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

// Placeholder page - the content below is a starting skeleton only.
// Replace the bracketed text in important.component.html with the real
// note to the technical team, then remove the "Placeholder" badge.
@Component({
  selector: 'app-important',
  standalone: true,
  imports: [],
  templateUrl: './important.component.html',
  styleUrl: './important.component.css',
})
export class ImportantComponent implements OnInit {
  constructor(private title: Title) {}

  ngOnInit(): void {
    this.title.setTitle('Important · Game Store');
  }
}
