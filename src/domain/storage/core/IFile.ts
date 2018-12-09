/**
 * File data interface.
 *
 * @author Dragos Sebestin
 */
export interface IFile {
  name: string,
  size: number,
  extension: string,
  mimeType: string,
  internalPath: string,
  downloadPath: string,
  originalName: string
}
